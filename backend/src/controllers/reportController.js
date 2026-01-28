import { Report } from '../models/reportModel.js';

export const reportController = {
 async submitReport(req, res) {
    try {
      const reporterId = req.user.data.id; // From auth middleware
      
      const { userId } = req.params; // Reported user ID
      const { reason } = req.body;
      console.log(`ids: `, reporterId, ` `, userId);
      
      // Validate
      if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
      }

      if (reporterId === parseInt(userId)) {
        return res.status(400).json({ message: 'Cannot report yourself' });
      }

      // Check if already reported
      const alreadyReported = await Report.exists(reporterId, userId);
      if (alreadyReported) {
        return res.status(400).json({ message: 'You already reported this user' });
      }

      // Create report
      const report = await Report.create(reporterId, userId, reason);
      
      // Increment report count in profile table
      await Report.incrementReportCount(userId);

      // 🔥 NEW: Check if user has reached 20 reports
      const userReportCount = await Report.getReportCount(userId);
      console.log(`User ${userId} has ${userReportCount} reports`);
      
      if (userReportCount >= 20) { // when reach 20 , i delelet account
        console.log(`🚨 User ${userId} reached 20 reports - DELETING ACCOUNT`);
        
        // Delete user account
        await Report.deleteUserAccount(userId);
        
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

  async getUserReports(req, res) {
    try {
      const { userId } = req.params;
      const reports = await Report.getByReportedUser(userId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
};