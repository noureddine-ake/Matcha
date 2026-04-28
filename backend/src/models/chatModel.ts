import { Messages, User, Notifications } from "../../database/entities/index.js";

// ✅ Get messages with pagination
export async function getMessagesPaginated(senderId: any, receiverId: any, cursor = null, limit = 20) {
  try {
    const countResult = await Messages.select(['COUNT(*) as count'])
      .whereAnd({
        sender_user_id: senderId,
        receiver_user_id: receiverId
      })
      .run();
    
    const countResult2 = await Messages.select(['COUNT(*) as count'])
      .whereAnd({
        sender_user_id: receiverId,
        receiver_user_id: senderId
      })
      .run();
    
    const totalMessages = (parseInt(countResult.rows[0].count) || 0) + (parseInt(countResult2.rows[0].count) || 0);

    let messages: any[] = [];
    
    if (cursor) {
      const cursorMsg = await Messages.select(['sent_at'])
        .where('id', cursor)
        .run();
      
      if (cursorMsg.rows.length === 0) {
        return { messages: [], hasMore: false, nextCursor: null, totalMessages };
      }
      
      const cursorTimestamp = cursorMsg.rows[0].sent_at;
      
      const query1 = Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
        .whereAnd({
          sender_user_id: senderId,
          receiver_user_id: receiverId
        })
        .where('sent_at', cursorTimestamp, '<');
      const olderResult1Final = await query1.orderBy('sent_at', 'DESC').limit(limit).run();

      const query2 = Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
        .whereAnd({
          sender_user_id: receiverId,
          receiver_user_id: senderId
        })
        .where('sent_at', cursorTimestamp, '<');
      const olderResult2Final = await query2.orderBy('sent_at', 'DESC').limit(limit).run();
      
      const combinedRows = [...olderResult1Final.rows, ...olderResult2Final.rows];
      const seenIds = new Set();
      const uniqueRows = combinedRows.filter((msg: any) => {
        if (seenIds.has(msg.id)) return false;
        seenIds.add(msg.id);
        return true;
      });

      messages = uniqueRows
        .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .slice(0, limit);
    } else {
      const latestResult1 = await Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
        .whereAnd({
          sender_user_id: senderId,
          receiver_user_id: receiverId
        })
        .orderBy('sent_at', 'DESC')
        .limit(limit)
        .run();
      
      const latestResult2 = await Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
        .whereAnd({
          sender_user_id: receiverId,
          receiver_user_id: senderId
        })
        .orderBy('sent_at', 'DESC')
        .limit(limit)
        .run();
      
      const combinedRows = [...latestResult1.rows, ...latestResult2.rows];
      const seenIds = new Set();
      const uniqueRows = combinedRows.filter((msg: any) => {
        if (seenIds.has(msg.id)) return false;
        seenIds.add(msg.id);
        return true;
      });

      messages = uniqueRows
        .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())
        .slice(0, limit);
    }

    messages = messages.reverse();

    const hasMore = cursor 
      ? messages.length === limit
      : totalMessages > limit;

    const nextCursor = messages.length > 0 ? messages[0].id : null;

    return {
      messages: messages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_user_id,
        receiverId: msg.receiver_user_id,
        content: msg.content,
        timestamp: msg.sent_at,
        read: msg.is_read
      })),
      hasMore,
      nextCursor,
      totalMessages
    };
  } catch (error) {
    console.error("❌ Error fetching paginated messages:", error);
    throw error;
  }
}

export async function getAllUsersExcept(currentUserId: any) {
  try {
    const result = await User.select(['u.id', 'u.username', 'u.email', 'u.created_at'])
      .from('users u')
      .join('INNER', 'likes l1', `l1.liker_user_id = ${currentUserId} AND l1.liked_user_id = u.id`)
      .join('INNER', 'likes l2', `l2.liker_user_id = u.id AND l2.liked_user_id = ${currentUserId}`)
      .orderBy('u.username', 'ASC')
      .run();
    
    return result.rows;
  } catch (error) {
    console.error("❌ Error in getMatchedUsers:", error);
    throw error;
  }
}

export async function userExists(userId: any) {
  try {
    if (!userId || isNaN(userId)) {
      console.log("❌ Invalid user ID:", userId);
      return false;
    }
    const result = await User.select(['id'])
      .where('id', userId)
      .run();
    return result.rows.length > 0;
  } catch (error) {
    console.error("❌ Error checking user existence for ID", userId, ":", error);
    return false;
  }
}

export async function getMessages(senderId: any, receiverId: any) {
  try {
    const result = await Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
      .whereAnd({
        sender_user_id: senderId,
        receiver_user_id: receiverId
      })
      .run();
    
    const result2 = await Messages.select(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
      .whereAnd({
        sender_user_id: receiverId,
        receiver_user_id: senderId
      })
      .run();
    
    const allMessages = [...result.rows, ...result2.rows];
    allMessages.sort((a: any, b: any) => 
      new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
    
    return allMessages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_user_id,
      receiverId: msg.receiver_user_id,
      content: msg.content,
      timestamp: msg.sent_at,
      read: msg.is_read
    }));
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    throw error;
  }
}

export async function saveMessage(senderId: any, receiverId: any, content: any) {
  try {
    const result = await Messages.insert({
      sender_user_id: senderId,
      receiver_user_id: receiverId,
      content: content,
      sent_at: new Date(),
      is_read: false
    })
      .returning(['id', 'sender_user_id', 'receiver_user_id', 'content', 'sent_at', 'is_read'])
      .run();
    
    const message = result.rows[0];
    return {
      id: message.id,
      senderId: message.sender_user_id,
      receiverId: message.receiver_user_id,
      content: message.content,
      timestamp: message.sent_at,
      read: message.is_read
    };
  } catch (error) {
    console.error("❌ Error saving message:", error);
    throw error;
  }
}

export async function markMessagesAsRead(senderId: any, receiverId: any) {
  try {
    await Messages.update({
      is_read: true
    })
      .where('sender_user_id', senderId)
      .whereAnd({ receiver_user_id: receiverId, is_read: false })
      .run();
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    throw error;
  }
}

export async function createNotification(userId: any, fromUserId: any) {
  try {
    await Notifications.insert({
      user_id: userId,
      from_user_id: fromUserId,
      type: 'message',
      is_read: false,
      created_at: new Date()
    })
      .run();
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    throw error;
  }
}
