const cron = require("node-cron");
const Order = require("../model/orderModel");

// Cleanup inactive orders older than 30 days
cron.schedule("0 2 * * *", async () => {
    console.log('working for cron')
  try {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const cutoffDate = new Date(Date.now() - THIRTY_DAYS);

    const result = await Order.deleteMany({
      isActive: false,
      updatedAt: { $lt: cutoffDate },
    });

    console.log(
      `[${new Date().toISOString()}] Cleanup job: Deleted ${result.deletedCount} inactive orders`
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Cleanup job error:`,
      error.message
    );
  }
});



// to test it 
// async function cleanupInactiveOrders() {
//   console.log('Cleanup function running...');
//   const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
//   const cutoffDate = new Date(Date.now() - THIRTY_DAYS);
//   const result = await Order.deleteMany({
//     isActive: false,
//     updatedAt: { $lt: cutoffDate },
//   });
//   console.log(`Deleted ${result.deletedCount} inactive orders`);
// }

// // Test manually
// cleanupInactiveOrders();
