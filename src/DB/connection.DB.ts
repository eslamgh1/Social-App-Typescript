import mongoose from "mongoose";  


export const connectionDB = async () => {
mongoose.connect(process.env.DB_URL_LOCAL as unknown as string)
.then(() => {
    console.log(`Database connected successfully ${process.env.DB_URL_LOCAL}`);
})
.catch((error) => {
    console.log("Database connection failed" ,error);

});

      
      }

// export default any name 
      export default connectionDB;
