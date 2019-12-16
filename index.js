const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const packageDefinition = protoLoader.loadSync("./notes.proto");
const grpcLibrary = require("@grpc/grpc-js");
const notesProto = grpcLibrary.loadPackageDefinition(packageDefinition);
const server = new grpc.Server();
const mongoose = require("mongoose");
const Mongo_URI = require("./config.json").Mongo_URI;
const Todo = require("./todoSchema");
mongoose.connect(Mongo_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});
mongoose.connection.once("open", () => {
  console.log("connected to mongdb");
});

server.addService(notesProto.TodoService.service, {
  list: (_, callback) => {
    Todo.find({})
      .then(todos => {
        callback(null, { todos: todos });
      })
      .catch(error => {
        callback({
          code: grpc.status.NOT_FOUND,
          message: error.message
        });
      });
  },
  insert: async (call, callback) => {
    let addtodo = call.request;
    const todo = await new Todo(addtodo);
    const todoAdded = await todo.save();
    if (todoAdded) {
      callback(null, todoAdded);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Todo Not Added"
      });
    }
  },
  delete: async (call, callback) => {
    let id = call.request.id;
    const todo = await Todo.findByIdAndDelete(id);
    if (todo) {
      callback(null, todo);
    } else {
      callback({
        code: grpc.status.NOT_FOUND,
        message: "Todo Not Deleted"
      });
    }
  },
 
});
server.bind("127.0.0.1:50050", grpc.ServerCredentials.createInsecure());
console.log("Server running at http://127.0.0.1:50050");
server.start();
