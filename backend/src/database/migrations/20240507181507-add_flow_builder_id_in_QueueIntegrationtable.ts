import { QueryInterface, DataTypes } from "sequelize";


module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("QueueIntegrations", "flowBuilderId", {
      type: DataTypes.INTEGER,
      allowNull: true,
  });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("QueueIntegrations", "flowBuilderId");
  }
};
