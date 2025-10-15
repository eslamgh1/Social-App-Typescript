const clientIo = io("http://localhost:3000",{
  auth:{
    authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDhkOTJhYzk1NWZjZjlmNzZiZmU5OCIsImVtYWlsIjoiZXNsYW1nb21hYTE5ODZAZ21haWwuY29tIiwiaWF0IjoxNzYwMzAzMjEzLCJleHAiOjE3NjIxMTc2MTMsImp0aSI6IjkwNTI2In0.LwBchFRoCKJTU7Lb7YLH0UiJ99I9EdnLJszj07naszQ"
  }
});


// clientIo.emit("sayHi", "Hi from frontend")

// clientIo.emit("sayHi", {message:"Hello from frontend" } , (data) => {
//     console.log(data);
// })




clientIo.on("connect", () => {
    console.log("Client connected");
});

clientIo.on("connect_error",(error)=> {
    console.log(error);
});
