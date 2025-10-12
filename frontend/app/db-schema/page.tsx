'use client';

import React, { useState } from 'react';
import { Database, GitBranch, Users, MessageSquare, Heart, Bell, Eye, MapPin } from 'lucide-react';

const MatchaDiagrams = () => {
  const [activeTab, setActiveTab] = useState('class');

  const ClassDiagram = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User Class */}
        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
          <h3 className="font-bold text-lg text-blue-900 mb-2">User</h3>
          <div className="text-sm">
            <div className="font-semibold text-blue-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>email: string</li>
              <li>username: string</li>
              <li>firstName: string</li>
              <li>lastName: string</li>
              <li>passwordHash: string</li>
              <li>isVerified: boolean</li>
              <li>verificationToken: string</li>
              <li>resetToken: string</li>
              <li>createdAt: Date</li>
              <li>updatedAt: Date</li>
            </ul>
          </div>
        </div>

        {/* Profile Class */}
        <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
          <h3 className="font-bold text-lg text-green-900 mb-2">Profile</h3>
          <div className="text-sm">
            <div className="font-semibold text-green-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>userId: number (FK)</li>
              <li>gender: string</li>
              <li>sexualPreference: string</li>
              <li>biography: text</li>
              <li>birthDate: date</li>
              <li>fameRating: number</li>
              <li>latitude: decimal</li>
              <li>longitude: decimal</li>
              <li>city: string</li>
              <li>country: string</li>
              <li>isOnline: boolean</li>
              <li>lastSeen: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Photo Class */}
        <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-50">
          <h3 className="font-bold text-lg text-purple-900 mb-2">Photo</h3>
          <div className="text-sm">
            <div className="font-semibold text-purple-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>userId: number (FK)</li>
              <li>photoUrl: string</li>
              <li>isProfilePicture: boolean</li>
              <li>uploadedAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Tag Class */}
        <div className="border-2 border-yellow-500 rounded-lg p-4 bg-yellow-50">
          <h3 className="font-bold text-lg text-yellow-900 mb-2">Tag</h3>
          <div className="text-sm">
            <div className="font-semibold text-yellow-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>name: string (unique)</li>
              <li>createdAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Like Class */}
        <div className="border-2 border-red-500 rounded-lg p-4 bg-red-50">
          <h3 className="font-bold text-lg text-red-900 mb-2">Like</h3>
          <div className="text-sm">
            <div className="font-semibold text-red-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>likerUserId: number (FK)</li>
              <li>likedUserId: number (FK)</li>
              <li>createdAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Message Class */}
        <div className="border-2 border-indigo-500 rounded-lg p-4 bg-indigo-50">
          <h3 className="font-bold text-lg text-indigo-900 mb-2">Message</h3>
          <div className="text-sm">
            <div className="font-semibold text-indigo-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>senderUserId: number (FK)</li>
              <li>receiverUserId: number (FK)</li>
              <li>content: text</li>
              <li>isRead: boolean</li>
              <li>sentAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* ProfileView Class */}
        <div className="border-2 border-teal-500 rounded-lg p-4 bg-teal-50">
          <h3 className="font-bold text-lg text-teal-900 mb-2">ProfileView</h3>
          <div className="text-sm">
            <div className="font-semibold text-teal-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>viewerUserId: number (FK)</li>
              <li>viewedUserId: number (FK)</li>
              <li>viewedAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Notification Class */}
        <div className="border-2 border-orange-500 rounded-lg p-4 bg-orange-50">
          <h3 className="font-bold text-lg text-orange-900 mb-2">Notification</h3>
          <div className="text-sm">
            <div className="font-semibold text-orange-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>userId: number (FK)</li>
              <li>type: string</li>
              <li>fromUserId: number (FK)</li>
              <li>isRead: boolean</li>
              <li>createdAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Block Class */}
        <div className="border-2 border-gray-500 rounded-lg p-4 bg-gray-50">
          <h3 className="font-bold text-lg text-gray-900 mb-2">Block</h3>
          <div className="text-sm">
            <div className="font-semibold text-gray-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>blockerUserId: number (FK)</li>
              <li>blockedUserId: number (FK)</li>
              <li>createdAt: timestamp</li>
            </ul>
          </div>
        </div>

        {/* Report Class */}
        <div className="border-2 border-rose-500 rounded-lg p-4 bg-rose-50">
          <h3 className="font-bold text-lg text-rose-900 mb-2">Report</h3>
          <div className="text-sm">
            <div className="font-semibold text-rose-800 mb-1">Properties:</div>
            <ul className="list-disc list-inside text-gray-700 space-y-0.5">
              <li>id: number</li>
              <li>reporterUserId: number (FK)</li>
              <li>reportedUserId: number (FK)</li>
              <li>reason: text</li>
              <li>createdAt: timestamp</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">Relationships:</h4>
        <ul className="list-disc list-inside text-blue-800 space-y-1">
          <li>User → Profile (1:1)</li>
          <li>User → Photo (1:Many)</li>
          <li>User → Tag (Many:Many via UserTag)</li>
          <li>User → Like (1:Many as liker and liked)</li>
          <li>User → Message (1:Many as sender and receiver)</li>
          <li>User → ProfileView (1:Many as viewer and viewed)</li>
          <li>User → Notification (1:Many)</li>
          <li>User → Block (1:Many as blocker and blocked)</li>
          <li>User → Report (1:Many as reporter and reported)</li>
        </ul>
      </div>
    </div>
  );

  const DatabaseSchema = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">PostgreSQL Database Schema</h2>
        <p className="text-sm">Optimized for Express.js without ORM - Manual Queries</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Users Table */}
        <div className="border-2 border-blue-600 rounded-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2 font-bold">
            users
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
            </pre>
          </div>
        </div>

        {/* Profiles Table */}
        <div className="border-2 border-green-600 rounded-lg overflow-hidden">
          <div className="bg-green-600 text-white px-4 py-2 font-bold">
            profiles
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gender VARCHAR(20),
    sexual_preference VARCHAR(20),
    biography TEXT,
    birth_date DATE,
    fame_rating DECIMAL(3,1) DEFAULT 0.0,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(100),
    country VARCHAR(100),
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(latitude, longitude);
            </pre>
          </div>
        </div>

        {/* Photos Table */}
        <div className="border-2 border-purple-600 rounded-lg overflow-hidden">
          <div className="bg-purple-600 text-white px-4 py-2 font-bold">
            photos
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    is_profile_picture BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photos_user_id ON photos(user_id);
            </pre>
          </div>
        </div>

        {/* Tags and UserTags Tables */}
        <div className="border-2 border-yellow-600 rounded-lg overflow-hidden">
          <div className="bg-yellow-600 text-white px-4 py-2 font-bold">
            tags & user_tags
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tag_id)
);

CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON user_tags(tag_id);
            </pre>
          </div>
        </div>

        {/* Likes Table */}
        <div className="border-2 border-red-600 rounded-lg overflow-hidden">
          <div className="bg-red-600 text-white px-4 py-2 font-bold">
            likes
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    liker_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(liker_user_id, liked_user_id),
    CHECK (liker_user_id != liked_user_id)
);

CREATE INDEX idx_likes_liker ON likes(liker_user_id);
CREATE INDEX idx_likes_liked ON likes(liked_user_id);
            </pre>
          </div>
        </div>

        {/* Messages Table */}
        <div className="border-2 border-indigo-600 rounded-lg overflow-hidden">
          <div className="bg-indigo-600 text-white px-4 py-2 font-bold">
            messages
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (sender_user_id != receiver_user_id)
);

CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_user_id);
            </pre>
          </div>
        </div>

        {/* Profile Views Table */}
        <div className="border-2 border-teal-600 rounded-lg overflow-hidden">
          <div className="bg-teal-600 text-white px-4 py-2 font-bold">
            profile_views
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE profile_views (
    id SERIAL PRIMARY KEY,
    viewer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (viewer_user_id != viewed_user_id)
);

CREATE INDEX idx_profile_views_viewer ON profile_views(viewer_user_id);
CREATE INDEX idx_profile_views_viewed ON profile_views(viewed_user_id);
            </pre>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="border-2 border-orange-600 rounded-lg overflow-hidden">
          <div className="bg-orange-600 text-white px-4 py-2 font-bold">
            notifications
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    from_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
            </pre>
          </div>
        </div>

        {/* Blocks Table */}
        <div className="border-2 border-gray-600 rounded-lg overflow-hidden">
          <div className="bg-gray-600 text-white px-4 py-2 font-bold">
            blocks
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE blocks (
    id SERIAL PRIMARY KEY,
    blocker_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(blocker_user_id, blocked_user_id),
    CHECK (blocker_user_id != blocked_user_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_user_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_user_id);
            </pre>
          </div>
        </div>

        {/* Reports Table */}
        <div className="border-2 border-rose-600 rounded-lg overflow-hidden">
          <div className="bg-rose-600 text-white px-4 py-2 font-bold">
            reports
          </div>
          <div className="p-4 bg-white">
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (reporter_user_id != reported_user_id)
);

CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported ON reports(reported_user_id);
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded mt-6">
        <h4 className="font-bold text-green-900 mb-2">Key Design Decisions:</h4>
        <ul className="list-disc list-inside text-green-800 space-y-1 text-sm">
          <li><strong>No ORM:</strong> All queries written manually using node-postgres library</li>
          <li><strong>Indexes:</strong> Strategic indexes on foreign keys and frequently queried columns</li>
          <li><strong>Constraints:</strong> CHECK constraints prevent self-likes, self-messages, etc.</li>
          <li><strong>CASCADE:</strong> ON DELETE CASCADE ensures referential integrity</li>
          <li><strong>Fame Rating:</strong> Calculated based on likes, views, and profile completeness</li>
          <li><strong>Security:</strong> Password stored as hash, tokens for verification/reset</li>
        </ul>
      </div>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
        <h4 className="font-bold text-yellow-900 mb-2">Performance Optimizations:</h4>
        <ul className="list-disc list-inside text-yellow-800 space-y-1 text-sm">
          <li>Composite indexes for common query patterns</li>
          <li>Connection pooling for Express.js</li>
          <li>Prepared statements for frequently used queries</li>
          <li>Consider materialized view for complex matching algorithm</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Matcha Project</h1>
          <p className="text-gray-600">Class Diagram & Database Schema</p>
          <p className="text-sm text-gray-500 mt-2">Express.js | PostgreSQL | No ORM</p>
        </div>

        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setActiveTab('class')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'class'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <GitBranch size={20} />
            Class Diagram
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'database'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Database size={20} />
            Database Schema
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-6">
          {activeTab === 'class' ? <ClassDiagram /> : <DatabaseSchema />}
        </div>
      </div>
    </div>
  );
};

export default MatchaDiagrams;