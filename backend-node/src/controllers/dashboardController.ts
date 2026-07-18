import { Request, Response } from 'express';
import { OpportunityModel, OPP_STAGES } from '../models/Opportunity';
import { RevenueRecordModel } from '../models/RevenueRecord';
import { TaskModel } from '../models/Task';
import { ActivityModel } from '../models/Activity';

export async function getDashboardSummary(req: Request, res: Response) {
  const ownerId = req.user!._id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [totalRevenue, monthRevenue, prevMonthRevenue] = await Promise.all([
    RevenueRecordModel.aggregate([
      { $match: { ownerId, status: 'received' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    RevenueRecordModel.aggregate([
      { $match: { ownerId, status: 'received', recordedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    RevenueRecordModel.aggregate([
      {
        $match: {
          ownerId,
          status: 'received',
          recordedAt: { $gte: startOfPrevMonth, $lt: startOfMonth },
        },
      },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
  ]);

  const pipelineValue = await OpportunityModel.aggregate([
    { $match: { ownerId, stage: { $nin: ['won', 'lost'] } } },
    { $group: { _id: null, sum: { $sum: '$potentialValue' }, count: { $sum: 1 } } },
  ]);

  const wonCount = await OpportunityModel.countDocuments({ ownerId, stage: 'won' });
  const closedCount = await OpportunityModel.countDocuments({ ownerId, stage: { $in: ['won', 'lost'] } });
  const openTasks = await TaskModel.countDocuments({ ownerId, status: { $in: ['todo', 'in_progress'] } });
  const overdueTasks = await TaskModel.countDocuments({
    ownerId,
    status: { $in: ['todo', 'in_progress'] },
    dueDate: { $lt: now },
  });

  const stageBreakdown = await OpportunityModel.aggregate([
    { $match: { ownerId } },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$potentialValue' } } },
  ]);
  const stageMap: Record<string, { count: number; value: number }> = {};
  for (const s of OPP_STAGES) stageMap[s] = { count: 0, value: 0 };
  for (const row of stageBreakdown) stageMap[row._id] = { count: row.count, value: row.value };

  const recentActivity = await ActivityModel.find({ ownerId }).sort({ createdAt: -1 }).limit(6);

  const total = totalRevenue[0]?.sum || 0;
  const mtd = monthRevenue[0]?.sum || 0;
  const prev = prevMonthRevenue[0]?.sum || 0;
  const growthPct = prev > 0 ? Math.round(((mtd - prev) / prev) * 100) : 0;
  const conversion = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  res.json({
    kpis: {
      totalRevenue: total,
      mtdRevenue: mtd,
      prevMonthRevenue: prev,
      growthPct,
      pipelineValue: pipelineValue[0]?.sum || 0,
      pipelineCount: pipelineValue[0]?.count || 0,
      conversionRate: conversion,
      openTasks,
      overdueTasks,
    },
    stageBreakdown: stageMap,
    recentActivity: recentActivity.map((a) => a.toJSON()),
  });
}

export async function getRevenueAnalytics(req: Request, res: Response) {
  const ownerId = req.user!._id;
  const monthsBack = 6;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1), 1);

  const monthly = await RevenueRecordModel.aggregate([
    { $match: { ownerId, status: 'received', recordedAt: { $gte: start } } },
    {
      $group: {
        _id: { y: { $year: '$recordedAt' }, m: { $month: '$recordedAt' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  const monthlySeries: Array<{ label: string; amount: number; count: number }> = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    const row = monthly.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1);
    monthlySeries.push({
      label: d.toLocaleString('en-US', { month: 'short' }),
      amount: row?.amount || 0,
      count: row?.count || 0,
    });
  }

  const bySource = await RevenueRecordModel.aggregate([
    { $match: { ownerId, status: 'received' } },
    { $group: { _id: '$source', amount: { $sum: '$amount' } } },
    { $sort: { amount: -1 } },
  ]);

  const byClient = await RevenueRecordModel.aggregate([
    { $match: { ownerId, status: 'received' } },
    { $group: { _id: '$client', amount: { $sum: '$amount' } } },
    { $sort: { amount: -1 } },
    { $limit: 5 },
  ]);

  res.json({
    monthlySeries,
    bySource: bySource.map((r) => ({ source: r._id, amount: r.amount })),
    topClients: byClient.map((r) => ({ client: r._id, amount: r.amount })),
  });
}
