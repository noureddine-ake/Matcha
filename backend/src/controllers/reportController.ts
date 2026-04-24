import { Request, Response } from 'express';
import { Reports } from '../../database/entities/reports.entity.js';
import { Profiles } from '../../database/entities/profiles.entity.js';
import { Raw } from '../../database/raw.js';
import { User } from '../../database/entities/users.entity.js';

export const reportController = {
  async submitReport(req: Request, res: Response) {
    try {
      const reporterId = req.user.data.id;

      const { userId } = req.params;
      const { reason } = req.body;
      console.log(`ids: `, reporterId, ` `, userId);

      // Validate
      if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
      }

      if (reporterId === parseInt(userId as string)) {
        return res.status(400).json({ message: 'Cannot report yourself' });
      }

      // Check if already reported
      const alreadyReported = await Reports.select(['1']).where('reporter_user_id', reporterId).where('reported_user_id', userId).run().then(result => result.rows.length > 0);
      if (alreadyReported) {
        return res.status(400).json({ message: 'You already reported this user' });
      }

      // Create report
      const report = await Reports.insert({
        reporter_user_id: reporterId,
        reported_user_id: userId,
        reason
      }).returning(['*']).run().then(result => result.rows[0]);

      console.log('Report created:', report);
      // Increment report count in profile table
      const userReportCount = await Profiles
        .update({
          report_count: new Raw(
            'CASE WHEN report_count IS NULL THEN 1 ELSE report_count + 1 END'
          )
        })
        .where('user_id', userId).returning(['report_count'])
        .run().then(result => result.rows[0]?.report_count || 0);

      console.log(`User ${userId} has ${userReportCount} reports----`);

      if (userReportCount >= 20) {
        console.log(`🚨 User ${userId} reached 20 reports - DELETING ACCOUNT`);

        // Delete user account
        await User.delete().where('id', userId).run();
        console.log(`✅ User ${userId} PERMANENTLY deleted`);

        return res.status(201).json({
          message: 'Report submitted successfully. User account has been deleted due to excessive reports.',
          report,
          accountDeleted: true
        });
      }

      res.status(201).json({
        message: 'Report submitted successfully',
        report,
        accountDeleted: false
      });

    } catch (error) {
      console.error('Report error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  async getUserReports(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const reports = Reports.select(['*']).where('reported_user_id', userId).orderBy('created_at', 'DESC').run().then(result => result.rows);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};