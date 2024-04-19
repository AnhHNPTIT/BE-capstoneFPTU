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
  find: jest.fn(),
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
  findOneAndUpdate: jest.fn(),
  aggregate: jest.fn(),
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

  describe("search_list_user", () => {
    const res = {
      json: jest.fn(),
    };

    it("should return list of users matching search criteria with only startDate", async () => {
      const req = {
        body: {
          userCode: "user123",
          fullName: "John Doe",
          role: "employee",
          startDate: "2024-04-01",
        },
        dataToken: {
          id: "",
        },
      };
      // Mock the UserSchema.aggregate function
      UserSchema.aggregate = jest.fn().mockResolvedValueOnce([
        {
          _id: "",
          userCode: "user123",
          fullName: "John Doe",
          role: "employee",
          createdAt: new Date(),
        },
      ]);

      await user.search_list_user(req, res);

      expect(UserSchema.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "",
        data: expect.any(Array),
      });
    });

    it("should return list of users matching search criteria with only endDate", async () => {
      const req = {
        body: {
          userCode: "user123",
          fullName: "John Doe",
          role: "employee",
          endDate: "2024-04-01",
        },
        dataToken: {
          id: "",
        },
      };
      // Mock the UserSchema.aggregate function
      UserSchema.aggregate = jest.fn().mockResolvedValueOnce([
        {
          _id: "",
          userCode: "user123",
          fullName: "John Doe",
          role: "employee",
          createdAt: new Date(),
        },
      ]);

      await user.search_list_user(req, res);

      expect(UserSchema.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "",
        data: expect.any(Array),
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

  describe("send_otp", () => {
    const emailQueue = {
      add: jest.fn(),
    };
    const req = {
      body: {
        email: "test@example.com",
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    beforeEach(() => {
      UserSchema.findOne.mockReset();
      UserSchema.updateOne.mockReset();
      emailQueue.add.mockReset();
      res.json.mockClear();
      res.status.mockClear();
    });

    it("should return message if user not found", async () => {
      UserSchema.findOne.mockResolvedValue(null);

      await user.send_otp(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Tài khoản của bạn không chính xác",
      });
    });

    it("should send OTP email if user found", async () => {
      const obj = { email: "test@example.com" };
      UserSchema.findOne.mockResolvedValue(obj);
      UserSchema.updateOne.mockResolvedValue({});

      await user.send_otp(req, res);

      expect(UserSchema.updateOne).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Mã OTP đã được gửi tới email",
      });
    });

    it("should return 500 if an error occurs", async () => {
      UserSchema.findOne.mockRejectedValue(new Error("Database error"));

      await user.send_otp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error error" });
    });
  });

  describe("user.change_password_otp", () => {
    const req = {
      body: {
        code_change_password: "12345",
        email: "test@example.com",
        passwordNew: "newpassword",
      },
    };

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    const bcrypt = require("bcrypt");
    jest.mock("bcrypt", () => ({
      hashSync: jest.fn(),
    }));

    it("should return 400 if user not found or OTP incorrect", async () => {
      UserSchema.findOne.mockResolvedValue(null);

      await user.change_password_otp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Tài khoản  hoặc mã otp của bạn không chính xác",
      });
    });

    it("should update password if user found and OTP correct", async () => {
      const data = { email: "test@example.com" };
      UserSchema.findOne.mockResolvedValue(data);
      bcrypt.hashSync.mockReturnValue("hashedpassword");
      UserSchema.updateOne.mockResolvedValue({});

      await user.change_password_otp(req, res);

      expect(bcrypt.hashSync).toHaveBeenCalledWith(req.body.passwordNew, 10);
      expect(UserSchema.updateOne).toHaveBeenCalledWith(
        { email: req.body.email },
        { $set: { password: "hashedpassword", code_change_password: "" } }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Thay đổi mật khẩu thành công",
      });
    });

    it("should return 500 if an error occurs", async () => {
      UserSchema.findOne.mockRejectedValue(new Error("Database error"));

      await user.change_password_otp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error error" });
    });
  });

  describe("uploadFile", () => {
    const reqWithFile = { file: { filename: "example.jpg" } };
    const reqWithoutFile = { file: null };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      res.json.mockClear();
    });

    it("should return success response with filename if file is uploaded", async () => {
      await user.uploadFile(reqWithFile, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        filename: "example.jpg",
      });
    });

    it("should return failure response if file is not uploaded", async () => {
      await user.uploadFile(reqWithoutFile, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "File upload failed",
      });
    });
  });

  describe("uploadMultiFile", () => {
    const files = [
      { filename: "file1.jpg" },
      { filename: "file2.png" },
      { filename: "file3.txt" },
    ];
    const reqWithFiles = { files: files };
    const reqWithoutFiles = { files: null };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      res.json.mockClear();
    });

    it("should return success response with file names if files are uploaded", async () => {
      await user.uploadMultiFile(reqWithFiles, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        fileNames: files,
      });
    });

    it("should return failure response if files are not uploaded", async () => {
      await user.uploadMultiFile(reqWithoutFiles, res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "File upload failed",
      });
    });
  });

  describe("updateUser", () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "newpassword",
        isActive: true,
        role: "user",
      },
    };
    const res = {
      json: jest.fn(),
    };

    const bcrypt = require("bcrypt");
    jest.mock("bcrypt", () => ({
      hashSync: jest.fn(),
    }));

    beforeEach(() => {
      UserSchema.findOneAndUpdate.mockReset();
      bcrypt.hashSync.mockReset();
      res.json.mockClear();
    });

    it("should update user with hashed password, isActive, and role", async () => {
      bcrypt.hashSync.mockReturnValue("hashedpassword");

      await user.updateUser(req, res);

      expect(bcrypt.hashSync).toHaveBeenCalledWith(req.body.password, 10);
      expect(UserSchema.findOneAndUpdate).toHaveBeenCalledWith(
        { email: req.body.email },
        {
          $set: {
            password: "hashedpassword",
            isActive: req.body.isActive,
            role: req.body.role,
          },
        }
      );
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Update success",
      });
    });
  });

  describe("get_list_for_role", () => {
    const req = {
      body: {
        userCode: "user1",
        fullName: "John Doe",
        email: "john@example.com",
        phoneNumber: "123456789",
        flagGetUser: "CUSTOMER",
        address: "123 Main St",
        designfile: "file123",
      },
      dataToken: {
        role: "ADMIN",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      UserSchema.aggregate.mockReset();
      res.json.mockClear();
    });

    it("should return list of users based on ADMIN role and CUSTOMER flag", async () => {
      // Mock data for aggregation result
      const userList = [
        {
          /* mock user data */
        },
      ];
      UserSchema.aggregate.mockResolvedValue(userList);

      await user.get_list_for_role(req, res);

      expect(UserSchema.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: "", data: userList });
    });
  });

  describe("updateInformationDESIGNER", () => {
    const req = {
      dataToken: {
        id: "user123",
      },
      body: {
        imageDesigner: "image.jpg",
        listImageProject: ["project1.jpg", "project2.jpg"],
        skill: "Graphic Design",
        designfile: "file123",
        experience: "5 years",
        description: "Graphic Designer",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      UserSchema.findOneAndUpdate.mockReset();
      DesignerSchema.findOneAndUpdate.mockReset();
      res.json.mockClear();
    });

    it("should update user information and designer information", async () => {
      await user.updateInformationDESIGNER(req, res);

      expect(UserSchema.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: req.dataToken.id },
        {
          $set: {
            description: req.body.description,
            imageUser: req.body.imageDesigner,
          },
        },
        { new: true }
      );

      expect(DesignerSchema.findOneAndUpdate).toHaveBeenCalledWith(
        { designerId: req.dataToken.id },
        {
          $set: {
            skill: req.body.skill,
            designfile: req.body.designfile,
            experience: req.body.experience,
            listImageProject: req.body.listImageProject,
          },
        },
        { new: true }
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Update success",
      });
    });
  });

  describe("getDesignerInfo", () => {
    const req = {
      params: {
        designerId: "designer123",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      res.json.mockClear();
    });

    it("should get designer info successfully", async () => {
      const userInfo = [
        {
          /* mock user info */
        },
      ];
      DesignerSchema.find.mockResolvedValue(userInfo);

      await user.getDesignerInfo(req, res);

      expect(DesignerSchema.find).toHaveBeenCalledWith({
        designerId: req.params.designerId,
      });
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Get user info successfully",
        userInfo: userInfo[0],
      });
    });

    it("should handle error if designer info is not found", async () => {
      DesignerSchema.find.mockResolvedValue([]);

      await user.getDesignerInfo(req, res);

      expect(DesignerSchema.find).toHaveBeenCalledWith({
        designerId: req.params.designerId,
      });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getInformationDESIGNER", () => {
    const { ObjectId } = require('mongoose').Types;
    const req = {
      params: {
        id: "designer123",
      },
      dataToken: {
        id: "user123",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      UserSchema.find.mockReset();
      DesignerSchema.aggregate.mockReset();
      res.json.mockClear();
    });

    it("should get designer information successfully", async () => {
      const userInfo = [
        {
          /* mock user info */
        },
      ];
      UserSchema.find.mockResolvedValue(userInfo);

      const data = [
        {
          /* mock data */
        },
      ];
      DesignerSchema.aggregate.mockResolvedValue(data);

      await user.getInformationDESIGNER(req, res);

      expect(UserSchema.find).toHaveBeenCalledWith({ _id: req.dataToken.id });
      expect(DesignerSchema.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            _id: ObjectId(req.params.id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "designerId",
            foreignField: "_id",
            as: "dataDesigner",
          },
        },
      ]);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: data,
        userInfo: userInfo[0],
      });
    });
  });

  describe('get_profile', () => {
    const { ObjectId } = require('mongoose').Types;
    const req = {
        dataToken: {
            id: 'user123',
            role: 'USER',
        },
    };
    const res = {
        json: jest.fn(),
    };

    beforeEach(() => {
        UserSchema.aggregate.mockReset();
        res.json.mockClear();
    });

    it('should get user profile successfully', async () => {
        const dataProfile = [{ /* mock user profile data */ }];
        UserSchema.aggregate.mockResolvedValue(dataProfile);

        await user.get_profile(req, res);

        expect(UserSchema.aggregate).toHaveBeenCalledWith([
            {
                $match: {
                    _id: ObjectId(req.dataToken.id),
                }
            },
            {
                $project: { password: 0 }
            }
        ]);

        expect(res.json).toHaveBeenCalledWith({ message: ' ', data: dataProfile });
    });
});


describe('update_user', () => {
  const req = {
      dataToken: {
          id: 'user123',
      },
      body: {
          image: 'image.jpg',
          fullName: 'John Doe',
          dob: '1990-01-01',
          phoneNumber: '123456789',
          email: 'john@example.com',
      },
  };
  const res = {
      json: jest.fn(),
  };

  it('should update user information successfully', async () => {
      await user.update_user(req, res);

      expect(UserSchema.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: req.dataToken.id },
          { $set: { imageUser: req.body.image, fullName: req.body.fullName, dob: req.body.dob, phoneNumber: req.body.phoneNumber, email: req.body.email } }
      );

      expect(res.json).toHaveBeenCalledWith({ message: 'update thành công', data: {} });
  });
});
});
