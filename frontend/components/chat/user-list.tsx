import { User } from "@/types/chat.types";
import { Clock, Users } from "lucide-react";
import Image from "next/image";
import { motion } from 'framer-motion';
import { memo } from "react";

interface UserItemProps {
  user: User;
  isSelected: boolean;
  onSelect: () => void;
}

export const UserItem: React.FC<UserItemProps> = memo(({ user, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-200 ${isSelected
        ? 'bg-purple-500/20 border-purple-400'
        : 'hover:bg-white/5'
        }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
            {user.profile_photo ? (
              <Image
                src={user.profile_photo}
                alt={user.username}
                className="w-full h-full object-cover"
                width={48}
                height={48}
                unoptimized
              />
            ) : (
              user.username.charAt(0).toUpperCase()
            )}
          </div>
          {/* <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.is_online ? 'bg-green-400' : 'bg-gray-400'
            }`} /> */}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold truncate">{user.username}</h3>
            {/* {!user.is_online && (
              <span className="text-xs text-white/60 flex items-center">
                <Clock className="w-3 h-3 inline mr-1" />
                Offline
              </span>
            )} */}
          </div>
          <p className="text-white/60 text-sm truncate">{user.email}</p>
        </div>
      </div>
    </motion.div>
  );
});

UserItem.displayName = 'UserItem';

interface UserListProps {
  users: User[];
  selectedUserId: string | null;
  searchTerm: string;
  onSelectUser: (userId: string) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, selectedUserId, searchTerm, onSelectUser }) => {
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filteredUsers.length === 0) {
    return (
      <div className="p-8 text-center text-white/60">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <>
      {filteredUsers.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          isSelected={selectedUserId === user.id}
          onSelect={() => onSelectUser(user.id)}
        />
      ))}
    </>
  );
};
