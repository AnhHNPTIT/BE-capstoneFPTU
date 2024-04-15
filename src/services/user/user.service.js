const UserModel = require("../../../models/users/user.model");

const createUser = async (payload) => {
   const res = {
      statusCode: 201,
      message: "Create user successfully",
      data: {},
   };

   try {
      const { firstName, lastName, password, email, gender } = payload;
      const requirements = {
         firstName,
         lastName,
         email,
         gender,
         password,
         role: "CUSTOMER",
         fullName: `${firstName} ${lastName}`.replace(/\s+/g, " "),
      };

      //create user
      const user = await UserModel.create(requirements);

      res.data = user;
   } catch (err) {
      console.log(err.message);
      res.statusCode = 500;
      res.message = "Create user failed";
   }

   return res;
};

const getUserByIdSevice = async ({ userId }) => {
   const res = {
      statusCode: 201,
      message: "Get user successfully",
      data: {},
   };

   try {
      const user = await UserModel.findById(userId);

      res.data = user;
   } catch (err) {
      console.log(err.message);
      res.statusCode = 500;
      res.message = "Get user by id failed";
   }

   return res;
};

module.exports = {
   createUser,
   getUserByIdSevice,
};
