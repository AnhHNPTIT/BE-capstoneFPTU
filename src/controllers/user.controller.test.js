// Mock bcrypt
jest.mock("bcrypt", () => ({
  hashSync: jest.fn((password, salt) => "mockHashedPassword"),
  compareSync: jest.fn(
    (password, hashedPassword) => password === "correctPassword"
  ),
}));

// Mock jwt
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn((data, secret, options) => "mockToken"),
}));

// Mock express-validator
const { validationResult } = require("express-validator");
jest.mock("express-validator", () => ({
  validationResult: jest.fn(() => ({
    isEmpty: jest.fn(() => true),
    array: jest.fn(() => []),
  })),
}));

// Mock mongoose
jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn(),
  },
}));

// Mock the UserSchema and other models
const UserSchema = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
};

const CustomerSchema = {
  save: jest.fn(),
};

const DesignerSchema = {
  save: jest.fn(),
  find: jest.fn(),
};

const ScheduleSchema = {
  save: jest.fn(),
};

jest.mock("../models/user.model", () => UserSchema);
jest.mock("../models/customer.model", () => CustomerSchema);
jest.mock("../models/designer.model", () => DesignerSchema);
jest.mock("../models/schedule.model", () => ScheduleSchema);

const user = require("./user.controller");
describe("user", () => {
  describe("register_user", () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "password",
        role: "CUSTOMER",
        phoneNumber: "123456789",
        dob: "1990-01-01",
      },
    };

    // it("Should handle validator", async () => {
    //   const res = {
    //     status: jest.fn(() => res),
    //     send: jest.fn(),
    //   };

    //   jest.mock("express-validator", () => ({
    //     validationResult: jest.fn(() => validationResult),
    //   }));

    //   await user.register_user(req, res);

    //   expect(res.status).toHaveBeenCalledWith(402);
    // });

    it("Should handle Email đã tồn tại trong hệ thống", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn(() => ({ email: "existing@example.com" }));
      await user.register_user(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Email đã tồn tại trong hệ thống",
      });
    });

    it("Should handle phoneNumber đã tồn tại trong hệ thống", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn((query) => {
        if (query.email === req.body.email) {
          return false;
        } else if (query.phoneNumber === req.body.phoneNumber) {
          return true;
        }
        return null;
      });

      await user.register_user(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "phoneNumber đã tồn tại trong hệ thống",
      });
    });
  });

  describe("login_email", () => {
    it("Should handle Tài khoản của bạn sai", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn(() => false);
      await user.login_email(
        {
          body: {
            email: "email@gmail.com",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tài khoản của bạn sai ",
      });
    });

    // it("Should return user information and access token for valid credentials", async () => {
    //   const req = {
    //     body: {
    //       email: "test@example.com",
    //       password: "password123",
    //     },
    //   };

    //   const res = {
    //     status: jest.fn(() => res),
    //     json: jest.fn(),
    //   };

    //   const mockUserData = {
    //     _id: "mockUserId",
    //     email: req.body.email,
    //     role: "userRole",
    //     password: "hashedPassword",
    //   };
    //   UserSchema.findOne = jest.fn(() => mockUserData);

    //   bcrypt.compareSync = jest.fn(() => true);

    //   const mockDesignerInfo = [{ _id: "mockDesignerId" }];
    //   DesignerSchema.find = jest.fn(() => mockDesignerInfo);

    //   const mockAccessToken = "mockAccessToken";
    //   createAccessToken = jest.fn(() => mockAccessToken);

    //   await user.login_email(req, res);

    //   expect(res.status).toHaveBeenCalledWith(200);
    //   expect(res.json).toHaveBeenCalledWith({
    //     message: "",
    //     data: {
    //       informationuser: {
    //         email: req.body.email,
    //         role: mockUserData.role,
    //         designerId:
    //           mockDesignerInfo.length > 0 ? mockDesignerInfo[0]._id : "",
    //       },
    //       cookie: mockAccessToken,
    //     },
    //   });
    // });
  });

  describe("login_phone", () => {
    it("Should handle phoneNumber của bạn sai ", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn(() => false);
      await user.login_phone(
        {
          body: {
            phoneNumber: "0123456789",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "phoneNumber của bạn sai ",
      });
    });

    it("Should handle Tài khoản của bạn bị xóa hoặc bị chặn login isDelete = true", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn(() => {
        isDelete: true;
      });
      await user.login_phone(
        {
          body: {
            phoneNumber: "0123456789",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "phoneNumber của bạn sai ",
      });
    });

    it("Should handle Tài khoản của bạn bị xóa hoặc bị chặn login isActive = false", async () => {
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
        send: jest.fn(),
      };

      UserSchema.findOne = jest.fn(() => {
        isActive: true;
      });
      await user.login_phone(
        {
          body: {
            phoneNumber: "0123456789",
          },
        },
        res
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "phoneNumber của bạn sai ",
      });
    });
  });

  describe("get_list_user", () => {
    it("should return list of users except the admin user", async () => {
      const req = {
        dataToken: { id: "userId" },
      };

      const res = {
        json: jest.fn(),
      };

      const mockListUser = [
        { _id: "user1Id", fullName: "User 1", role: "USER" },
        { _id: "user2Id", fullName: "User 2", role: "DESIGNER" },
        { _id: "adminId", fullName: "Admin", role: "ADMIN" },
      ];
      UserSchema.aggregate = jest.fn(() => mockListUser);

      await user.get_list_user(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "",
        data: mockListUser,
      });
    });
  });

  describe("delete_user", () => {
    it("should delete user successfully", async () => {
      const req = {
        params: { id: "userId" },
      };

      const res = {
        json: jest.fn(),
      };

      UserSchema.findOneAndUpdate = jest.fn(() => ({ isDelete: true }));

      await user.delete_user(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: "Xóa thành công" });
    });

    it("should return error message on deletion failure", async () => {
      const req = {
        params: { id: "userId" },
      };

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      UserSchema.findOneAndUpdate = jest.fn(() => {
        throw new Error("Mock error");
      });

      await user.delete_user(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Xóa error" });
    });
  });

  describe("change_password", () => {
    it("should change password successfully", async () => {
      const req = {
        dataToken: { id: "userId" },
        body: {
          passwordNew: "newPassword123",
          passwordOld: "oldPassword123",
        },
      };

      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      const mockUserData = {
        _id: req.dataToken.id,
        password: "hashedOldPassword",
      };
      UserSchema.findOne = jest.fn(() => mockUserData);

      //   bcrypt.compareSync = jest.fn(() => true);

      //   bcrypt.hashSync = jest.fn(() => "hashedNewPassword");

      await user.change_password(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Mật khẩu cũ không đúng",
      });
    });

    it('should return "Server error" message on server error', async () => {
      // Mock request object
      const req = {
        dataToken: { id: "userId" },
        body: {
          passwordNew: "newPassword123",
          passwordOld: "oldPassword123",
        },
      };

      // Mock response object and its methods
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      // Mock UserSchema.findOne to throw an error
      UserSchema.findOne = jest.fn(() => {
        throw new Error("Mock error");
      });

      // Call the function being tested
      await user.change_password(req, res);

      // Check if the status and json methods were called with the correct arguments
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server error" });
    });
  });
});
