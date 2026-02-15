const axios = require("axios");
const K = require("../constants/constants");

const TEKMETRIC_URL = process.env.TEKMETRIC_URL;
const TEKMETRIC_CLIENT_ID = process.env.TEKMETRIC_CLIENT_ID;
const TEKMETRIC_CLIENT_SECRET = process.env.TEKMETRIC_CLIENT_SECRET;

const getAccessToken = async () => {
  const basicAuth = Buffer.from(
    `${TEKMETRIC_CLIENT_ID}:${TEKMETRIC_CLIENT_SECRET}`,
    "utf8",
  ).toString("base64");

  const response = await axios.post(
    `${TEKMETRIC_URL}${K.Tekmetric.Auth}`,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    },
  );
  return {
    accessToken: response.data.access_token,
    scope: response.data.scope,
  };
};

exports.getEmployees = async () => {
  const { accessToken, scope } = await getAccessToken();
  const response = await axios.get(
    `${TEKMETRIC_URL}${K.Tekmetric.Employees}?shop=${scope}&size=${100}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  if (response.data && response.data.content) {
    const { content } = response.data;
    return content.filter((item) => item.employeeRole.id == 3);
  }
  return response.data;
};

exports.getCustomers = async () => {
  const { accessToken, scope } = await getAccessToken();

  const repairOrdersResponse = await axios.get(
    `${TEKMETRIC_URL}${K.Tekmetric.RepairOrders}?shop=${scope}&size=100&repairOrderStatusId=2`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  const repairOrders = repairOrdersResponse.data;

  const customerIds = repairOrders.content.map((item) => ({
    id: item.customerId,
    assignedTechnicianId: item.jobs[0]?.technicianId,
    repairOrderNumber: item.repairOrderNumber,
  }));

  const customersRelevantData = await Promise.all(
    customerIds.map(async (obj) => {
      const customerResponse = await axios.get(
        `${TEKMETRIC_URL}${K.Tekmetric.Customers}/${obj.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        ...customerResponse.data,
        assignedTechnicianId: obj.assignedTechnicianId,
        repairOrderNumber: obj.repairOrderNumber,
      };
    }),
  );

  return customersRelevantData;
};
