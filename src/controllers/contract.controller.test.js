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
  save: jest.fn(),
};

const ProjectSchema = {};

const CategorySchema = {};

jest.mock("../models/contract.model", () => ContractSchema);
jest.mock("../models/user.model", () => UserSchema);
jest.mock("../models/customer.model", () => CustomerSchema);
jest.mock("../models/designer.model", () => DesignerSchema);
jest.mock("../models/schedule.model", () => ScheduleSchema);
jest.mock("../models/project.model", () => ProjectSchema);
jest.mock("../models/categories.model", () => CategorySchema);

const contract = require("./contract.controller");
describe("contract", () => {
  describe("create_contract", () => {
    const req = {
      body: {
        codeContract: "ABC123",
        // Other contract data...
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it("should handle error if the contract code already exists", async () => {
      // Mock that the contract code already exists in the database
      ContractSchema.findOne.mockResolvedValue({
        /* mock existing contract */
      });

      await contract.create_contract(req, res);

      expect(ContractSchema.findOne).toHaveBeenCalledWith({
        codeContract: req.body.codeContract,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Mã hợp đồng đã tồn tại",
      });
      // Ensure that ContractSchema.save is not called
      expect(ContractSchema.save).not.toHaveBeenCalled();
    });
  });

  describe("delete_contract", () => {
    const req = {
      params: {
        id: "contract123",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      ContractSchema.updateOne.mockReset();
      res.json.mockClear();
    });

    it("should delete the contract successfully", async () => {
      await contract.delete_contract(req, res);

      expect(ContractSchema.updateOne).toHaveBeenCalledWith(
        { _id: req.params.id },
        { $set: { isDelete: true } }
      );
      expect(res.json).toHaveBeenCalledWith({
        message: "Delete success",
        data: {},
      });
    });
  });

  describe("contract_persion", () => {
    const req = {
      dataToken: {
        id: "customer123",
      },
    };
    const res = {
      json: jest.fn(),
    };

    it("should get contracts of the customer successfully", async () => {
      const listContract = [
        {
          /* mock contract data */
        },
      ];
      ContractSchema.find.mockResolvedValue(listContract);

      await contract.contract_persion(req, res);

      expect(ContractSchema.find).toHaveBeenCalledWith({
        custormerId: req.dataToken.id,
      });
      expect(res.json).toHaveBeenCalledWith({
        message: "get success",
        data: { listContract },
      });
    });
  });

  describe("list_contract", () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    it("should get list of contracts successfully", async () => {
      // Mock list of contracts and count of documents
      const listData = [
        {
          /* mock contract data */
        },
      ];
      const countFind = 5; // Mock count of documents

      ContractSchema.aggregate.mockResolvedValue(listData);
      ContractSchema.countDocuments.mockResolvedValue(countFind);

      await contract.list_contract(req, res);

      expect(ContractSchema.aggregate).toHaveBeenCalled();
      expect(ContractSchema.countDocuments).toHaveBeenCalled();

      expect(res.json).toHaveBeenCalledWith({
        message: "get list success",
        data: {
          listContract: listData,
          count: countFind,
        },
      });
    });
  });

  describe("list_contract_user", () => {
    const req = {
      dataToken: {
        id: "customer123",
      },
    };
    const res = {
      json: jest.fn(),
    };

    it("should get list of contracts for the customer successfully", async () => {
      // Mock list of contracts
      const listData = [
        {
          /* mock contract data */
        },
      ];

      ContractSchema.aggregate.mockResolvedValue(listData);

      await contract.list_contract_user(req, res);

      expect(ContractSchema.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            isDelete: false,
            custormerId: undefined,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { custormerId: "$custormerId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$custormerId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  fullName: 1,
                  email: 1,
                },
              },
            ],
            as: "customerData",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { designerId: "$designerId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$designerId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  fullName: 1,
                  email: 1,
                },
              },
            ],
            as: "designerData",
          },
        },
      ]);

      expect(res.json).toHaveBeenCalledWith({
        message: "get list success",
        data: {
          listContract: listData,
        },
      });
    });
  });

  describe("email_consulation", () => {
    const emailQueue = {
      add: jest.fn(),
    };

    const req = {
      body: {
        emailCustomer: "customer@example.com",
        fullName: "John Doe",
        phone: "123456789",
        note: "This is a consultation request.",
        address: "123 Main Street",
      },
    };
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      emailQueue.add.mockClear();
      res.json.mockClear();
    });

    it("should send an email for consultation and respond with success message", async () => {
      await contract.email_consulation(req, res);

      expect(res.json).toHaveBeenCalledWith({
        message: "Email thông báo cần tư vấn thành công",
        data: {},
      });
    });
  });

  describe("get_contract_detail", () => {
    const req = {
      params: {
        id: "contractId123",
      },
    };
    const res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };

    it("should get the contract detail successfully if contract exists", async () => {
      // Mock data for found contract
      const foundContract = {
        _id: "contractId123",
        codeContract: "CON123",
        amount: 1000,
      };

      // Mock the find method to return the found contract
      ContractSchema.find.mockResolvedValue([foundContract]);

      await contract.get_contract_detail(req, res);

      expect(ContractSchema.find).toHaveBeenCalledWith({ _id: req.params.id });
    });

    it("should return an error if the contract does not exist", async () => {
      // Mock no contract found
      ContractSchema.find.mockResolvedValue(null);

      await contract.get_contract_detail(req, res);

      expect(ContractSchema.find).toHaveBeenCalledWith({ _id: req.params.id });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Không tồn tại hợp đồng",
      });
    });
  });

  describe("search_contract", () => {
    const req = {
      body: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
        codeContract: "CON123",
        customerName: "John Doe",
        nameSignature: "Signature",
      },
    };
    const res = {
      json: jest.fn(),
    };
    it("should search contracts based on provided criteria", async () => {
      // Mock data for found contracts
      const foundContracts = [
        {
          _id: "contractId1",
          codeContract: "CON123",
          nameSignature: "Signature",
          custormerId: "customerId1",
        },
        {
          _id: "contractId2",
          codeContract: "CON456",
          nameSignature: "Signature2",
          custormerId: "customerId2",
        },
      ];

      // Mock the aggregate method to return the found contracts
      ContractSchema.aggregate.mockResolvedValue(foundContracts);

      await contract.search_contract(req, res);

      expect(ContractSchema.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "get contract success",
        data: {
          contract: foundContracts,
        },
      });
    });
  });
});
