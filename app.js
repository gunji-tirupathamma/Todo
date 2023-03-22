const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//  API-1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
                        todo LIKE '%${search_q}%'
                            AND status="${status}"
                            AND priority="${priority}";`;
      break;

    case hasPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE 
                    todo LIKE '%${search_q}%'
                    AND priority="${priority}";`;
      break;

    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE
                    todo LIKE '%${search_q}%'
                    AND status="${status}";`;
      break;

    default:
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//  API-2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSingleTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoValue = await db.get(getSingleTodoQuery);
  response.send(todoValue);
});

//API-3

app.post("/todos/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;

  const addNewTodoQuery = `INSERT INTO todo(todo,priority, status)
                                VALUES("${todo}","${priority}","${status}")
                                ;`;
  const dbResponse = await db.run(addNewTodoQuery);
  const addTodoId = dbResponse.lastID;
  response.send("Todo Successfully Added");
});

// API-4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  let updatedColumn = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;

  const previousTodo = ({
    todo = previousTodoQuery.todo,
    priority = previousTodoQuery.priority,
    status = previousTodoQuery.status,
  } = request.body);
  const updateQuery = `UPDATE todo
                        SET todo="${todo}",
                        priority="${priority}",
                        status="${status}"
                        WHERE id=${todoId}; `;
  await db.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});

// API-5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSingleTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(getSingleTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
