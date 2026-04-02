import entities from "./entities/index.js";
import orm from "./orm.js";

export async function initDB() {
    // Wave 1 — no dependencies
    await Promise.all([
        orm.define("users", entities.users.usersColumns),
        orm.define("tags", entities.tags.tagsColumns)
    ])

    // Wave 2 — depend on users
    await Promise.all([
        orm.define("profiles", entities.profiles.profilesColumns),
        orm.define("photos", entities.photos.photosColumns),
        orm.define("likes", entities.likes.likesColumns),
        orm.define("messages", entities.messages.messagesColumns),
        orm.define("profile_views", entities.profile_views.profileViewsColumns),
        orm.define("notifications", entities.notifications.notificationsColumns),
        orm.define("blocks", entities.blocks.blocksColumns, entities.blocks.blocksConstraints),
        orm.define("reports", entities.reports.reportsColumns, entities.reports.reportsConstraints),
        orm.define("email_verifications", entities.email_verifications.emailVerificationsColumns)
    ])

    // // Wave 3 — depend on users AND tags
    await orm.define("user_tags", entities.user_tags.userTagsColumns, entities.user_tags.userTagsConstraints);
}
