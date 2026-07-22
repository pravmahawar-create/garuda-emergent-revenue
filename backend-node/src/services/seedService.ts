import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { OpportunityModel } from '../models/Opportunity';
import { TaskModel } from '../models/Task';
import { RevenueRecordModel } from '../models/RevenueRecord';
import { NotificationModel } from '../models/Notification';
import { ActivityModel } from '../models/Activity';
import { env } from '../config/env';

const LEGACY_DEMO_CLIENTS = ['Meridian Capital', 'Halston & Vance', 'North Ridge Federal', 'Lumen Studios', 'Kobe Systems', 'Ashcroft Holdings', 'Vector Foundry'];
const LEGACY_DEMO_NOTIFICATIONS = ['Meridian Capital advanced to Proposal', '3 tasks due within 48 hours', 'Q1 revenue crossed $1.2M'];

/** Removes only the original scaffold's exact demo fixtures; user-created data is untouched. */
export async function purgeLegacyDemoData() {
  const admin = await UserModel.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (!admin) return { removed: 0 };
  const ownerId = admin._id as Types.ObjectId;
  const demoOpps = await OpportunityModel.find({ ownerId, client: { $in: LEGACY_DEMO_CLIENTS } }).select('_id').lean();
  const opportunityIds = demoOpps.map((item) => item._id);
  const [opportunities, tasks, revenue, notifications, activities] = await Promise.all([
    OpportunityModel.deleteMany({ ownerId, _id: { $in: opportunityIds } }),
    TaskModel.deleteMany({ ownerId, $or: [{ opportunityId: { $in: opportunityIds } }, { title: { $in: ['Weekly pipeline review', 'Publish revenue outlook to leadership'] } }] }),
    RevenueRecordModel.deleteMany({ ownerId, client: { $in: LEGACY_DEMO_CLIENTS } }),
    NotificationModel.deleteMany({ ownerId, title: { $in: LEGACY_DEMO_NOTIFICATIONS } }),
    ActivityModel.deleteMany({ ownerId, $or: [{ entityId: { $in: opportunityIds } }, { title: { $regex: 'Meridian Capital|Halston & Vance|Kobe Systems|Vector Foundry|\\$320,000' } }] }),
  ]);
  const removed = opportunities.deletedCount + tasks.deletedCount + revenue.deletedCount + notifications.deletedCount + activities.deletedCount;
  if (removed) console.log(`[seed] Removed ${removed} legacy demo records; dashboard now reports real data only`);
  return { removed };
}
