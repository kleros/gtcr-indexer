// import assert from "assert";
// import {
//   TestHelpers,
//   LightGTCRFactory_NewGTCR
// } from "generated";
// const { MockDb, LightGTCRFactory } = TestHelpers;

// describe("LightGTCRFactory contract NewGTCR event tests", () => {
//   // Create mock db
//   const mockDb = MockDb.createMockDb();

//   // Creating mock for LightGTCRFactory contract NewGTCR event
//   const event = LightGTCRFactory.NewGTCR.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

//   it("LightGTCRFactory_NewGTCR is created correctly", async () => {
//     // Processing the event
//     const mockDbUpdated = await LightGTCRFactory.NewGTCR.processEvent({
//       event,
//       mockDb,
//     });

//     // Getting the actual entity from the mock database
//     let actualLightGTCRFactoryNewGTCR = mockDbUpdated.entities.LightGTCRFactory_NewGTCR.get(
//       `${event.chainId}_${event.block.number}_${event.logIndex}`
//     );

//     // Creating the expected entity
//     const expectedLightGTCRFactoryNewGTCR: LightGTCRFactory_NewGTCR = {
//       id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
//       _address: event.params._address,
//     };
//     // Asserting that the entity in the mock database is the same as the expected entity
//     assert.deepEqual(actualLightGTCRFactoryNewGTCR, expectedLightGTCRFactoryNewGTCR, "Actual LightGTCRFactoryNewGTCR should be the same as the expectedLightGTCRFactoryNewGTCR");
//   });
// });
