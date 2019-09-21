import React from "react";
import _ from "lodash";
import cn from "classnames";
import csvtojson from "csvtojson";

const onlyTakeMeaningfulTags = items =>
  _.filter(items, item => ["phase:1.1", "phase:1.2", "phase:2.0", "surprise-change", "requirement-not-fixed", "not-needed-development"].includes(item));

const takeTags = _.flow([_.map, _.flatten, _.uniq, onlyTakeMeaningfulTags]);
const takeTypes = _.flow([_.map, _.flatten, _.uniq]);
const millisecondsToHours = ms => parseFloat((ms * (1 / 1000) * (1 / 60) * (1 / 60)).toFixed(3));

const getTimeLogged = (summationCategory, fullListItem, listItemCategoryPropName) => {
  return summationCategory.reduce((acc, category) => {
    acc[category] = fullListItem.reduce((sum, item) => {
      if (_.defaultTo(item[listItemCategoryPropName], "").includes(category)) {
        return sum + millisecondsToHours(item["User Period Time Spent"]);
      }
      return sum;
    }, 0);
    return acc;
  }, {});
};

const getTaskNameList = (summationCategory, fullListItem, listItemCategoryPropName) => {
  return summationCategory.reduce((acc, category) => {
    if (_.isEmpty(acc['other'])) {
      acc['other'] = []
    }

    acc[category] = fullListItem.reduce((list, item) => {
      const timeLoggedInHr = millisecondsToHours(item["User Period Time Spent"]);

      if (_.defaultTo(item[listItemCategoryPropName], "").includes(category)) {
        return [
          ...list,
          {
            ...item,
            displayName: `${item["Task Name"]} [${timeLoggedInHr}]`,
            link: `https://app.clickup.com/t/${item["Task ID"]}`
          }
        ];
      }


      if (_.isEmpty(_.intersection(summationCategory, item[listItemCategoryPropName]))) {
        acc['other'] = [
          ...acc['other'],
          {
            ...item,
            displayName: `${item["Task Name"]} [${timeLoggedInHr}]`,
            link: `https://app.clickup.com/t/${item["Task ID"]}`
          }
        ]
      }
      return list;
    }, []);
    return acc;
  }, {});
};

const parseJsonObjectValues = dataObj => {
  const returnObj = {};
  _.forEach(dataObj, (val, key) => {
    try {
      const parsedValue = JSON.parse(val);
      returnObj[key] = parsedValue;
    } catch (e) {
      returnObj[key] = val;
    }
  });
  return returnObj;
};

function App() {
  const [lastSelectedItem, setLastSelectedItem] = React.useState("");
  const [clickUpData, setClickUpData] = React.useState([]);

  const sortedByTimeLogged = _.sortBy(clickUpData, ["User Period Time Spent"]);

  const tags = takeTags(sortedByTimeLogged, item => item.Tags);
  const types = takeTypes(sortedByTimeLogged, item => item.Type);

  const tagSummations = getTimeLogged(tags, sortedByTimeLogged, "Tags");
  const tagTaskNames = getTaskNameList(tags, sortedByTimeLogged, "Tags");

  const typeSummations = getTimeLogged(types, sortedByTimeLogged, "Type");
  const totalTime = sortedByTimeLogged.reduce((sum, item) => sum + millisecondsToHours(item["User Period Time Spent"]), 0);

  return (
    <div
      style={{
        padding: "1.25rem"
      }}
    >
      <input
        type="file"
        accept="text/csv"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            const myFile = e.target.files[0];
            const reader = new FileReader();

            reader.onload = e => {
              (async () => {
                const csvConvertedToArr = await csvtojson().fromString(e.target.result);
                const jsonParsedCsvArr = csvConvertedToArr.map(dataObj => parseJsonObjectValues(dataObj));
                setClickUpData(jsonParsedCsvArr);
              })();
            };

            reader.readAsBinaryString(myFile);
          }
        }}
      />

      <h1>
        <strong>TOTAL:</strong> {totalTime}
      </h1>

      <h1>TAG</h1>
      {_.map(tagSummations, (time, name) => (
        <div>
          <strong>{name}:</strong> {time}
        </div>
      ))}

      <h1>TYPE</h1>
      {_.map(typeSummations, (time, name) => (
        <div>
          <strong>{name}:</strong> {time}
        </div>
      ))}

      <h1>TAG TASKS NAMES</h1>
      {_.map(tagTaskNames, (tasks, tag) => (
        <div>
          <h4>{tag}</h4>
          <ol>
            {_.map(tasks, task => (
              <li
                className={cn(lastSelectedItem === `${tag}__${task.link}` && "last-selected-item")}
                onClick={() => setLastSelectedItem(`${tag}__${task.link}`)}
              >
                <a href={task.link} target="_blank" rel="noopener noreferrer">
                  {task.displayName}
                </a>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default App;
