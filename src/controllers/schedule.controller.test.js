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

// Mock mongoose
jest.mock("mongoose", () => ({
  Types: {
    ObjectId: jest.fn(),
  },
}));

// Mock the ContractSchema and other models
const ContractSchema = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
  countDocuments: jest.fn(),
};

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
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
  findOneAndDelete: jest.fn(),
};

const ProjectSchema = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
  findOneAndDelete: jest.fn(),
};

const ProjectTypeSchema = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  aggregate: jest.fn(),
  save: jest.fn(),
};

const CategorySchema = {};

jest.mock("../models/contract.model", () => ContractSchema);
jest.mock("../models/user.model", () => UserSchema);
jest.mock("../models/customer.model", () => CustomerSchema);
jest.mock("../models/designer.model", () => DesignerSchema);
jest.mock("../models/schedule.model", () => ScheduleSchema);
jest.mock("../models/project.model", () => ProjectSchema);
jest.mock("../models/categories.model", () => CategorySchema);
jest.mock("../models/projectType.model", () => ProjectTypeSchema);

const schedule = require("./schedule.controller");
describe("schedule", () => {
  describe("createSchedule", () => {
    const req = {
      dataToken: { id: "userId" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    beforeEach(() => {
      res.status.mockClear();
      res.json.mockClear();
    });

    it("should return busyDates, workOnDates, designerId when no busy schedules exist", async () => {
      DesignerSchema.find.mockResolvedValueOnce([{ _id: "designerId" }]);
      ScheduleSchema.find.mockResolvedValueOnce([]);
      ScheduleSchema.find.mockResolvedValueOnce([]);
      ScheduleSchema.find.mockResolvedValueOnce([]);

      await schedule.createSchedule(req, res);

      expect(DesignerSchema.find).toHaveBeenCalledWith({
        designerId: "userId",
      });
      expect(ScheduleSchema.find).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        busyDates: [],
        scheduleId: "",
        workOnDates: [],
        designerId: "designerId",
      });
    });

    it("should return busyDates, workOnDates, designerId with busy schedules", async () => {
      DesignerSchema.find.mockResolvedValueOnce([{ _id: "designerId" }]);
      ScheduleSchema.find.mockResolvedValueOnce([
        { timeWork: "2024-04-20T08:00:00.000Z" },
      ]);
      ScheduleSchema.find.mockResolvedValueOnce([
        { timeWork: "2024-04-21T08:00:00.000Z" },
        { timeWork: "2024-04-22T08:00:00.000Z" },
      ]);

      await schedule.createSchedule(req, res);

      expect(DesignerSchema.find).toHaveBeenCalledWith({
        designerId: "userId",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        busyDates: ["2024-04-20T08:00:00.000Z"],
        scheduleId: "",
        workOnDates: [],
        designerId: "designerId",
        pendingDates: ["2024-04-21T08:00:00.000Z", "2024-04-22T08:00:00.000Z"],
      });
    });
  });

  describe("getDesignerCalendar", () => {
    const req = {
      params: { designerId: "designerId" },
      dataToken: { id: "userId" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    beforeEach(() => {
      res.status.mockClear();
      res.json.mockClear();
    });

    it("should return busyDates, workOnDates, scheduleId, isSelectBook, isSelectBefore, and pendingDates", async () => {
      ScheduleSchema.find.mockResolvedValueOnce([
        { timeWork: "2024-04-20T08:00:00.000Z" },
      ]);
      ScheduleSchema.find.mockResolvedValueOnce([
        { timeWork: "2024-04-21T08:00:00.000Z" },
        { timeWork: "2024-04-22T08:00:00.000Z" },
      ]);
      ScheduleSchema.find.mockResolvedValueOnce([]);
      ScheduleSchema.findOneAndUpdate.mockResolvedValueOnce({
        _id: "scheduleId",
      });
      ScheduleSchema.find.mockResolvedValueOnce([
        { isSelectBook: true, status: "ACCEPT" },
      ]);

      await schedule.getDesignerCalendar(req, res);

      expect(ScheduleSchema.findOneAndUpdate).toHaveBeenCalledWith(
        {
          designerId: "designerId",
          customerId: "userId",
          timeWork: { $ne: null },
        },
        {
          $setOnInsert: {
            designerId: "designerId",
            customerId: "userId",
            timeWork: null,
            workOn: false,
          },
        },
        { upsert: true, new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        busyDates: ["2024-04-21T08:00:00.000Z", "2024-04-22T08:00:00.000Z"],
        scheduleId: "scheduleId",
        workOnDates: ["2024-04-20T08:00:00.000Z"],
        designerId: "designerId",
        isSelectBook: true,
        isSelectBefore: true,
        pendingDates: [],
      });
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      const req = {
        params: { designerId: "designer_id" },
        dataToken: { id: "user_id" },
      };
      const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
      };

      // Mocking the ScheduleSchema.find function to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Mocked error"));

      // Call the controller function
      await schedule.getDesignerCalendar(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã xảy ra lỗi khi lấy danh sách các ngày bận của designer.",
      });
    });
  });

  describe("register_schedule_on", () => {
    it("should handle success", async () => {
      const req = {
        body: {
          timeWorkOn: [],
          description_off: "Some description",
        },
        dataToken: { id: "user_id" },
      };
      const res = {
        json: jest.fn(),
      };

      // Mocking the DesignerSchema.find function to throw an error
      DesignerSchema.find = jest.fn().mockReturnValueOnce([
        {
          _id: "",
        },
      ]);

      // Call the controller function
      await schedule.register_schedule_on(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("book_for_customer", () => {
    it("should return 400 if user role is not ADMIN or STAFF and the user has already booked an appointment", async () => {
      const req = {
        dataToken: { id: "user_id", role: "CUSTOMER" },
        body: { timeWork: "2024-04-20", id_schedule: "designer_id" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mocking the ScheduleSchema.find function to return a schedule
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([{ _id: "schedule_id" }]);

      // Call the controller function
      await schedule.book_for_customer(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bạn đã đặt lịch kiến trúc sư khác rồi",
      });
    });

    it("should return 400 if proposed time is earlier than current time with role is ADMIN", async () => {
      // Mock the request object with a proposed time earlier than the current time
      const req = {
        dataToken: { id: "user_id", role: "ADMIN" },
        body: {
          timeWork: "2023-01-01",
          id_schedule: "designer_id",
          role: "ADMIN",
        },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Call the controller function
      await schedule.book_for_customer(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Thời gian đặt lịch phải lớn hơn thời gian hiện tại",
      });
    });

    it("should return 400 if proposed time is earlier than current time with role is STAFF", async () => {
      // Mock the request object with a proposed time earlier than the current time
      const req = {
        dataToken: { id: "user_id", role: "STAFF" },
        body: {
          timeWork: "2023-01-01",
          id_schedule: "designer_id",
          role: "STAFF",
        },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Call the controller function
      await schedule.book_for_customer(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Thời gian đặt lịch phải lớn hơn thời gian hiện tại",
      });
    });

    it("should return 400 if user role is not ADMIN or STAFF and the user has already booked an appointment", async () => {
      // Mock the request object with user role as CUSTOMER
      const req = {
        dataToken: { id: "user_id", role: "CUSTOMER" },
        body: { timeWork: "2024-04-20", id_schedule: "designer_id" },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the ScheduleSchema.find function to return a schedule
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([{ _id: "schedule_id" }]);

      // Call the controller function
      await schedule.book_for_customer(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Bạn đã đặt lịch kiến trúc sư khác rồi",
      });
    });

    it("should return 200 and successfully update the schedule for regular users", async () => {
      // Mock the request object for updating schedule for regular users
      const req = {
        dataToken: { id: "user_id", role: "CUSTOMER" },
        body: {
          timeSelect: "2024-04-20",
          id_schedule: "schedule_id",
          description_book: "Updated appointment",
          timeWork: "2024-04-25",
          phoneNumber: "123456789",
          email: "test@example.com",
          place: "Test place",
          role: "CUSTOMER",
        },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the ScheduleSchema.find function to return an existing schedule
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([{ _id: "schedule_id" }]);

      ScheduleSchema.find = jest.fn().mockResolvedValue([]);

      // Call the controller function
      await schedule.book_for_customer(req, res);

      // Expectations
      // expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "",
        data: "Đặt lịch thành công",
      });
    });
  });

  describe("getScheduleInfoByDesigner", () => {
    it("should return schedule information for a designer successfully", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "designer_id" },
        query: { timeWork: "2024-04-20" },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the DesignerSchema.findOne function to return designer information
      DesignerSchema.findOne = jest
        .fn()
        .mockResolvedValue({ _id: "designer_id" });

      // Mock the ScheduleSchema.find function to return schedule information
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([{ _id: "schedule_id", customerId: "customer_id" }]);

      // Mock the UserSchema.findOne function to return user information
      UserSchema.findOne = jest
        .fn()
        .mockResolvedValue({ _id: "customer_id", fullName: "Test User" });

      // Call the controller function
      await schedule.getScheduleInfoByDesigner(req, res);

      // Expectations
      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Schedule information retrieved successfully",
        data: {
          schedule: { _id: "schedule_id", customerId: "customer_id" },
          user: { _id: "customer_id", fullName: "Test User" },
        },
      });
    });

    it('should handle "Designer not found" and return a 404 status code', async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "invalid_designer_id" },
        query: { timeWork: "2024-04-20" },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the DesignerSchema.findOne function to return null (Designer not found)
      DesignerSchema.findOne = jest.fn().mockResolvedValue(null);

      // Call the controller function
      await schedule.getScheduleInfoByDesigner(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Designer not found" });
    });

    it('should handle "No schedule found" and return a 404 status code', async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "designer_id" },
        query: { timeWork: "2024-04-20" },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the DesignerSchema.findOne function to return designer information
      DesignerSchema.findOne = jest
        .fn()
        .mockResolvedValue({ _id: "designer_id" });

      // Mock the ScheduleSchema.find function to return an empty array (No schedule found)
      ScheduleSchema.find = jest.fn().mockResolvedValue([]);

      // Call the controller function
      await schedule.getScheduleInfoByDesigner(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "No schedule found" });
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      const req = {
        dataToken: { id: "designer_id" },
        query: { timeWork: "2024-04-20" },
      };
      
      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find to throw an error
      DesignerSchema.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getScheduleInfoByDesigner(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Internal server error" });
    });
  });

  describe("getScheduleInfoByCustomer", () => {
    it("should return schedule information for a customer successfully", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "customer_id" },
        query: { timeWork: "2024-04-20" },
      };

      // Mock the response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock the ScheduleSchema.find function to return schedule information
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([{ _id: "schedule_id", customerId: "customer_id" }]);

      // Call the controller function
      await schedule.getScheduleInfoByCustomer(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "Lấy thông tin đặt lịch thành công",
        data: [{ _id: "schedule_id", customerId: "customer_id" }],
      });
    });
  });

  describe("getGraySchedule", () => {
    it("should return gray schedule information for a designer successfully", async () => {
      // Mock the request object
      const req = {
        params: { designerId: "designer_id" },
        query: { timeWork: "2024-04-20" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
      };

      // Mock the ScheduleSchema.find function to return gray schedule information
      ScheduleSchema.find = jest
        .fn()
        .mockResolvedValue([
          { _id: "schedule_id", designerId: "designer_id", workOn: false },
        ]);

      // Call the controller function
      await schedule.getGraySchedule(req, res);

      // Expectations
      expect(res.json).toHaveBeenCalledWith({
        message: "Lấy thông tin đặt lịch thành công",
        data: [
          { _id: "schedule_id", designerId: "designer_id", workOn: false },
        ],
      });
    });
  });

  describe("getAllListSchedule", () => {
    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getAllListSchedule({}, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "user_id" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find function to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getAllListSchedule({}, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getListScheduleByUser", () => {
    it("should return list of schedules for a user successfully", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "user_id" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find function to return schedule list
      ScheduleSchema.find = jest.fn().mockResolvedValue([
        {
          _id: "schedule_id_1",
          customerId: "user_id",
          workOn: true,
          designerId: "designer_id_1",
        },
        {
          _id: "schedule_id_2",
          customerId: "user_id",
          workOn: true,
          designerId: "designer_id_2",
        },
      ]);

      // Mock ScheduleSchema.find function to return pending schedule list
      ScheduleSchema.find.mockResolvedValueOnce([
        {
          _id: "pending_schedule_id",
          customerId: "user_id",
          workOn: false,
          status: "PENDDING",
          designerId: "pending_designer_id",
        },
      ]);

      // Mock DesignerSchema.findOne function to return designer info
      DesignerSchema.findOne = jest.fn().mockResolvedValueOnce({
        _id: "designer_id_1",
        designerId: "designer_id_1",
      });

      // Mock UserSchema.findOne function to return user info
      UserSchema.findOne = jest.fn().mockResolvedValueOnce({
        _id: "designer_id_1",
        fullName: "Designer 1",
      });

      // Call the controller function
      await schedule.getListScheduleByUser(req, res);

      // Expectations
      expect(res.json).toHaveBeenCalled();
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "user_id" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find function to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getListScheduleByUser(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã xảy ra lỗi khi lấy thông tin đặt lịch",
      });
    });
  });

  describe("searchListSchedule", () => {
    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        body: {
          time: "All",
          designerName: "John Doe",
          customerName: "Jane Doe",
          startDate: "2024-04-01",
          endDate: "2024-04-30",
        },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock UserSchema.findOne and ScheduleSchema.find to throw an error
      UserSchema.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.searchListSchedule(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });
  });

  describe("updateSchedule", () => {
    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        params: { designerId: "designer_id" },
        body: { status: "APPROVED", timeSelect: "2024-04-20T12:00:00" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.findOneAndUpdate function to throw an error
      ScheduleSchema.findOneAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.updateSchedule(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        dataToken: { id: "user_id" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getListScheduleByUser(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: "Đã xảy ra lỗi khi lấy thông tin đặt lịch",
      });
    });
  });

  describe("getScheduleById", () => {
    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        params: { scheduleId: "schedule_id" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.find to throw an error
      ScheduleSchema.find = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.getScheduleById(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });

    it("should handle errors and return a 500 status code with an error message", async () => {
      // Mock the request object
      const req = {
        params: { designerId: "designer_id" },
        body: { status: "APPROVED", timeSelect: "2024-04-25T08:00:00.000Z" },
      };

      // Mock the response object
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      // Mock ScheduleSchema.findOneAndUpdate to throw an error
      ScheduleSchema.findOneAndUpdate = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      // Call the controller function
      await schedule.updateSchedule(req, res);

      // Expectations
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Server Error" });
    });
  });
});
