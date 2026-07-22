import { Types } from 'mongoose';
import { UserModel } from '../models/User';
import { OpportunityModel, OPP_STAGES } from '../models/Opportunity';
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

/**
 * Seed rich demo data for the admin user. Idempotent: only seeds if the admin
 * has zero opportunities.
 */
export async function seedDemoData() {
  const admin = await UserModel.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (!admin) return;
  const existing = await OpportunityModel.countDocuments({ ownerId: admin._id });
  if (existing > 0) return;

  const ownerId = admin._id as Types.ObjectId;
  const now = new Date();

  const opps = await OpportunityModel.insertMany([
    {
      ownerId,
      title: 'Enterprise AI Platform Rollout',
      client: 'Meridian Capital',
      source: 'referral',
      stage: 'proposal',
      potentialValue: 480000,
      currency: 'USD',
      probability: 65,
      expectedCloseDate: new Date(now.getTime() + 21 * 864e5),
      notes: 'Champion identified. Awaiting board signoff on Q2 budget.',
      tags: ['enterprise', 'ai', 'strategic'],
    },
    {
      ownerId,
      title: 'Predictive Analytics Retainer',
      client: 'Halston & Vance',
      source: 'inbound',
      stage: 'negotiation',
      potentialValue: 220000,
      currency: 'USD',
      probability: 80,
      expectedCloseDate: new Date(now.getTime() + 10 * 864e5),
      notes: 'Legal review of MSA in progress.',
      tags: ['retainer', 'analytics'],
    },
    {
      ownerId,
      title: 'Guardian Compliance Module',
      client: 'North Ridge Federal',
      source: 'outbound',
      stage: 'qualified',
      potentialValue: 310000,
      currency: 'USD',
      probability: 45,
      expectedCloseDate: new Date(now.getTime() + 45 * 864e5),
      notes: 'Discovery workshop scheduled next week.',
      tags: ['compliance', 'government'],
    },
    {
      ownerId,
      title: 'Creative Studio License',
      client: 'Lumen Studios',
      source: 'partner',
      stage: 'prospect',
      potentialValue: 95000,
      currency: 'USD',
      probability: 20,
      expectedCloseDate: new Date(now.getTime() + 60 * 864e5),
      tags: ['creative', 'saas'],
    },
    {
      ownerId,
      title: 'Regional Deployment - APAC',
      client: 'Kobe Systems',
      source: 'event',
      stage: 'won',
      potentialValue: 640000,
      currency: 'USD',
      probability: 100,
      expectedCloseDate: new Date(now.getTime() - 12 * 864e5),
      notes: 'Kickoff completed. Delivery in progress.',
      tags: ['enterprise', 'apac'],
    },
    {
      ownerId,
      title: 'Knowledge Engine Pilot',
      client: 'Ashcroft Holdings',
      source: 'inbound',
      stage: 'lost',
      potentialValue: 140000,
      currency: 'USD',
      probability: 0,
      expectedCloseDate: new Date(now.getTime() - 30 * 864e5),
      notes: 'Chose incumbent vendor. Revisit in Q4.',
      tags: ['knowledge', 'pilot'],
    },
    {
      ownerId,
      title: 'Custom Agent Framework',
      client: 'Vector Foundry',
      source: 'referral',
      stage: 'proposal',
      potentialValue: 180000,
      currency: 'USD',
      probability: 55,
      expectedCloseDate: new Date(now.getTime() + 30 * 864e5),
      tags: ['agents', 'framework'],
    },
  ]);

  const tasks = await TaskModel.insertMany([
    { ownerId, opportunityId: opps[0]._id, title: 'Send updated proposal deck to CFO', status: 'in_progress', priority: 'high', dueDate: new Date(now.getTime() + 2 * 864e5) },
    { ownerId, opportunityId: opps[1]._id, title: 'Finalize MSA redlines with legal', status: 'todo', priority: 'critical', dueDate: new Date(now.getTime() + 1 * 864e5) },
    { ownerId, opportunityId: opps[2]._id, title: 'Prepare compliance discovery agenda', status: 'todo', priority: 'medium', dueDate: new Date(now.getTime() + 5 * 864e5) },
    { ownerId, opportunityId: opps[4]._id, title: 'Confirm APAC delivery milestones', status: 'done', priority: 'medium', completedAt: new Date(now.getTime() - 3 * 864e5) },
    { ownerId, title: 'Weekly pipeline review', status: 'todo', priority: 'low', dueDate: new Date(now.getTime() + 4 * 864e5) },
    { ownerId, opportunityId: opps[6]._id, title: 'Scope custom agent workflow requirements', status: 'in_progress', priority: 'high', dueDate: new Date(now.getTime() + 7 * 864e5) },
    { ownerId, title: 'Publish revenue outlook to leadership', status: 'todo', priority: 'medium', dueDate: new Date(now.getTime() + 3 * 864e5) },
  ]);

  // Revenue records spread across last 6 months
  const revenue = [];
  for (let i = 0; i < 12; i++) {
    const monthOffset = Math.floor(i / 2);
    revenue.push({
      ownerId,
      opportunityId: opps[i % opps.length]._id,
      amount: 15000 + Math.round(Math.random() * 65000),
      currency: 'USD',
      source: ['referral', 'inbound', 'outbound', 'partner', 'event'][i % 5],
      client: opps[i % opps.length].client,
      status: 'received' as const,
      recordedAt: new Date(now.getTime() - monthOffset * 30 * 864e5 - Math.random() * 20 * 864e5),
    });
  }
  // Big won-deal payment
  revenue.push({
    ownerId,
    opportunityId: opps[4]._id,
    amount: 320000,
    currency: 'USD',
    source: 'event',
    client: opps[4].client,
    status: 'received' as const,
    recordedAt: new Date(now.getTime() - 8 * 864e5),
  });
  await RevenueRecordModel.insertMany(revenue);

  await NotificationModel.insertMany([
    { ownerId, title: 'Meridian Capital advanced to Proposal', level: 'success', link: '/opportunities' },
    { ownerId, title: '3 tasks due within 48 hours', level: 'warning', link: '/tasks' },
    { ownerId, title: 'Q1 revenue crossed $1.2M', level: 'info', link: '/analytics' },
  ]);

  await ActivityModel.insertMany([
    { ownerId, type: 'opportunity_created', title: 'Created opportunity Meridian Capital', entityType: 'opportunity', entityId: opps[0]._id, createdAt: new Date(now.getTime() - 12 * 864e5) },
    { ownerId, type: 'opportunity_stage_changed', title: 'Halston & Vance moved to Negotiation', entityType: 'opportunity', entityId: opps[1]._id, createdAt: new Date(now.getTime() - 5 * 864e5), meta: { from: 'proposal', to: 'negotiation' } },
    { ownerId, type: 'revenue_recorded', title: 'Recorded $320,000 from Kobe Systems', entityType: 'revenue', createdAt: new Date(now.getTime() - 8 * 864e5) },
    { ownerId, type: 'task_completed', title: 'Confirmed APAC delivery milestones', entityType: 'task', entityId: tasks[3]._id, createdAt: new Date(now.getTime() - 3 * 864e5) },
    { ownerId, type: 'opportunity_updated', title: 'Updated notes on Vector Foundry', entityType: 'opportunity', entityId: opps[6]._id, createdAt: new Date(now.getTime() - 2 * 864e5) },
  ]);

  console.log('[seed] Demo data seeded');
}
