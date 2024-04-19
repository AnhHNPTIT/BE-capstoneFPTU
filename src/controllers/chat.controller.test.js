jest.mock("../models/lastmessage.model", () => ({
  LastMeesageSchema: {
    aggregate: jest.fn(),
  },
}));

jest.mock("../models/messagechat.model", () => ({
  MeesageChatSchema: {
    aggregate: jest.fn(),
  },
}));

const chat = require("./chat.controller");

describe("get_message_last", () => {
  const req = {
    body: {
      idStaff: "staffId123",
    },
  };
  const res = {
    json: jest.fn(),
  };

  it("should get the last chat message successfully", async () => {
    const dataLastChat = [
      {
        _id: "lastMessageId1",
        idStaff: "staffId123",
        idCustomer: "customerId123",
        message: "Hello, how can I help you?",
      },
    ];
  });
});

