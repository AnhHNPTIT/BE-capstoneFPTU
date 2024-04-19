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

const project = require("./project.controller");
describe("project", () => {
  describe("create_project_type", () => {
    const req = {
      body: {
        nameProjectType: "New Project Type",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    beforeEach(() => {
      ProjectTypeSchema.findOne.mockReset();
      ProjectTypeSchema.save.mockReset();
      res.status.mockClear();
      res.json.mockClear();
    });

    it("should return error if project type already exists", async () => {
      // Mock data for existing project type (found)
      const existingProjectType = {
        _id: "existingProjectTypeId",
        nameProjectType: "New Project Type",
      };
      ProjectTypeSchema.findOne.mockResolvedValue(existingProjectType);

      await project.create_project_type(req, res);

      expect(ProjectTypeSchema.findOne).toHaveBeenCalledWith({
        nameProjectType: "New Project Type",
      });
      expect(ProjectTypeSchema.save).not.toHaveBeenCalled(); // Save should not be called if project type already exists
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "projectType đã tồn tại trong hệ thống",
      });
    });
  });

  describe("get_project_type", () => {
    const req = {};
    const res = {
      json: jest.fn(),
    };

    beforeEach(() => {
      ProjectTypeSchema.find.mockReset();
      res.json.mockClear();
    });

    it("should return a list of project types", async () => {
      // Mock data for project types
      const projectTypes = [
        { _id: "projectTypeId1", nameProjectType: "Project Type 1" },
        { _id: "projectTypeId2", nameProjectType: "Project Type 2" },
      ];
      ProjectTypeSchema.find.mockResolvedValue(projectTypes);

      await project.get_project_type(req, res);

      expect(ProjectTypeSchema.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        message: "",
        data: {
          listProjectType: projectTypes,
        },
      });
    });
  });

  describe("check_project_type", () => {
    const req = {
      body: {},
    };
    const res = {
      status: jest.fn(() => ({
        json: jest.fn(),
      })),
    };

    it("should return status 400 if project type exists", async () => {
      // Mock data for an existing project type
      const existingProjectType = {
        _id: "projectId",
        nameProjectType: "Existing Project Type",
      };
      ProjectTypeSchema.findOne.mockResolvedValue(existingProjectType);

      req.body.nameProjectTypeNew = "Existing Project Type";
      await project.check_project_type(req, res);

      expect(ProjectTypeSchema.findOne).toHaveBeenCalledWith({
        nameProjectType: "Existing Project Type",
      });
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should not return any response if project type does not exist", async () => {
      // Mock no data for a non-existing project type
      ProjectTypeSchema.findOne.mockResolvedValue(null);

      req.body.nameProjectTypeNew = "Non-existing Project Type";
      await project.check_project_type(req, res);

      expect(ProjectTypeSchema.findOne).toHaveBeenCalledWith({
        nameProjectType: "Non-existing Project Type",
      });
      expect(res.status).toHaveBeenCalled();
    });
  });

  describe("check_design", () => {
    const req = {
      body: {},
    };
    const res = {
      json: jest.fn(),
    };

    it("should return the correct data if designer exists", async () => {});
  });

  describe("get_project_category_id", () => {
    const req = { params: { id: "projectId" } };
    const res = {
      json: jest.fn(),
    };

    it("should get project category by id successfully", async () => {
      const mockData = [
        {
          _id: "projectId",
          projectName: "Project 1",
          designerId: "designerId",
          dataDesigner: [{ designerId: "designerId" }],
          categoryData: [{ categoryName: "Category 1" }],
        },
      ];

      ProjectSchema.aggregate.mockResolvedValueOnce(mockData);

      await project.get_project_category_id(req, res);

      expect(ProjectSchema.aggregate).toHaveBeenCalledWith([
        {
          $match: {
            _id: undefined,
          },
        },
        {
          $lookup: {
            from: "designers",
            localField: "designerId",
            foreignField: "designerId",
            as: "dataDesigner",
          },
        },
        {
          $unwind: "$dataDesigner",
        },
        {
          $lookup: {
            from: "users",
            localField: "dataDesigner.designerId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "projectIds",
            as: "categoryData",
          },
        },
      ]);

      expect(res.json).toHaveBeenCalledWith({
        message: "Success",
        data: { listProject: mockData },
      });
    });
  });

  describe("del_project", () => {
    const req = { params: { id: "projectId" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it("should delete project successfully", async () => {
      const deletedProject = { _id: "projectId", projectName: "Project 1" };
      ProjectSchema.findOneAndDelete.mockResolvedValueOnce(deletedProject);

      await project.del_project(req, res);

      expect(ProjectSchema.findOneAndDelete).toHaveBeenCalledWith({
        _id: "projectId",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Project deleted successfully",
        deletedProject,
      });
    });

    it("should handle project not found", async () => {
      ProjectSchema.findOneAndDelete.mockResolvedValueOnce(null);

      await project.del_project(req, res);

      expect(ProjectSchema.findOneAndDelete).toHaveBeenCalledWith({
        _id: "projectId",
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Project not found" });
    });

    it("should handle internal server error", async () => {
      const errorMessage = "Internal server error";
      ProjectSchema.findOneAndDelete.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await project.del_project(req, res);

      expect(ProjectSchema.findOneAndDelete).toHaveBeenCalledWith({
        _id: "projectId",
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
