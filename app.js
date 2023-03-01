const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");

/*
const date = "2021-2-12";

const dateArray = date.split("-");
const year = dateArray[0];
const month = dateArray[1] - 1;
const day = dateArray[2];

const formatedDate = format(new Date(year, month, day), "yyyy-MM-dd");
console.log(formatedDate);
console.log(isValid(new Date(year, month, day)));
*/

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const checkValidations = (request, response, next) => {
  const { priority, status, category, date } = request.query;
  const { todoId } = request.params;
  const priorityArray = ["HIGH", "MEDIUM", "LOW"];
  const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
  const categoryArray = ["WORK", "HOME", "LEARNING"];

  if (priority !== undefined) {
    const isPriorityPresent = priorityArray.includes(priority);
    if (isPriorityPresent) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (status !== undefined) {
    const isStatusPresent = statusArray.includes(status);
    if (isStatusPresent) {
      requeest.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (category !== undefined) {
    const isCategoryPresent = categoryArray.includes(category);
    if (isCategoryPresent) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (date !== undefined) {
    const dateArray = date.split("-");
    const year = dateArray[0];
    const month = dateArray[1] - 1;
    const day = dateArray[2];

    const formatedDate = format(new Date(year, month, day), "yyyy-MM-dd");

    const isValidDate = isValid(new Date(formatedDate));

    if (isValidDate) {
      request.date = formatedDate;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  next();
};

app.get("/todos/", checkValidations, async (request, response) => {
  const { priority, status, category, date, search_q = "" } = request.query;

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };
  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };
  const hasCategoryAndStatus = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.status !== undefined
    );
  };
  const hasCategoryAndPriority = (requestQuery) => {
    return (
      requestQuery.category !== undefined && requestQuery.priority !== undefined
    );
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  const hasCategoryProperty = (requestQuery) => {
    return requestQuery.category !== undefined;
  };

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND category = '${category}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}'
            AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND category = '${category}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%';`;
  }

  const todosArray = await db.all(getTodosQuery);
  const responseArray = [];
  const getCamelCase = (todosArray) => {
    for (let todo of todosArray) {
      responseArray.push({
        id: todo.id,
        todo: todo.todo,
        priority: todo.priority,
        status: todo.status,
        category: todo.category,
        dueDate: todo.due_date,
      });
    }
  };
  getCamelCase(todosArray);

  response.send(responseArray);
});

//API 2

app.get("/todos/:todoId/", checkValidations, async (request, response) => {
  const { todoId } = request.params;
  getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            id = ${todoId};`;
  const todo = await db.get(getTodosQuery);
  const getCamelCase = (todo) => {
    return {
      id: todo.id,
      todo: todo.todo,
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      dueDate: todo.due_date,
    };
  };
  response.send(getCamelCase(todo));
});

//API 3

app.get("/agenda/", checkValidations, async (request, response) => {
  const { date } = request.query;
  console.log(date);
  getTodosQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
           due_date = ${date};`;
  const todosArray = await db.all(getTodosQuery);
  const responseArray = [];
  const getCamelCase = (todosArray) => {
    for (let todo of todosArray) {
      responseArray.push({
        id: todo.id,
        todo: todo.todo,
        priority: todo.priority,
        status: todo.status,
        category: todo.category,
        dueDate: todo.due_date,
      });
    }
  };
  getCamelCase(todosArray);

  response.send(responseArray);
});

//API 4

app.post("/todos/", checkValidations, async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;
  const addTodosQuery = `
        INSERT INTO todo
        (id,todo,priority,status,category,due_date)
        VALUES
        (
            ${id},
            "${todo}",
            "${priority}",
            "${status}",
            "${category}",
            "${dueDate}"
        ) ;
    `;

  await db.run(addTodosQuery);
  response.send("Todo Successfully Added");
});

//API 5

app.put("/todos/:todoId/", checkValidations, async (request, response) => {
  const { todoId } = request.params;
  const { todo, status, priority, category, dueDate } = request.body;

  const haveTodo = (requestBody) => {
    return requestBody.todo !== undefined;
  };
  const haveStatus = (requestBody) => {
    return requestBody.status !== undefined;
  };
  const havePriority = (requestBody) => {
    return requestBody.priority !== undefined;
  };
  const haveCategory = (requestBody) => {
    return requestBody.category !== undefined;
  };
  const haveDuedate = (requestBody) => {
    return requestBody.dueDate !== undefined;
  };

  let updateTodoQuery;
  switch (true) {
    case haveTodo(request.body):
      updateTodoQuery = `
        UPDATE todo 
        SET 
        todo = "${todo}"
        WHERE 
        id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
    case haveStatus(request.body):
      updateTodoQuery = `
        UPDATE todo 
        SET 
        status = "${status}"
        WHERE 
        id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Status Updated");
      break;
    case havePriority(request.body):
      updateTodoQuery = `
        UPDATE todo 
        SET 
        priority = "${priority}"
        WHERE 
        id = ${todoId};`;

      await db.run(updateTodoQuery);
      response.send("Priority Updated");
      break;
    case haveCategory(request.body):
      updateTodoQuery = `
        UPDATE todo 
        SET 
        todo = "${category}"
        WHERE 
        id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Category Updated");
      break;
    case haveDuedate(request.body):
      updateTodoQuery = `
        UPDATE todo 
        SET 
        todo = "${dueDate}"
        WHERE 
        id = ${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Due Date Updated");
      break;
  }
});

//API 7

app.delete("/todos/:todoId/", checkValidations, async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
        DELETE FROM todo 
        WHERE 
        id = ${todoId} ;
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
