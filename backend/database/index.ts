import * as entities from "./entities/index.js";

export async function initDB() {
  // Wave 1 — no dependencies
  await Promise.all([entities.User.define(), entities.Tags.define()]);

  // Wave 2 — depend on users
  await Promise.all([
    entities.Profiles.define(),
    entities.Photos.define(),
    entities.Likes.define(),
    entities.Messages.define(),
    entities.ProfileViews.define(),
    entities.Notifications.define(),
    entities.Blocks.define(entities.Blocks.constraints),
    entities.Reports.define(entities.Reports.constraints),
    entities.EmailVerifications.define(),
  ]);

  // Wave 3 — depend on users AND tags
  await entities.UserTags.define(entities.UserTags.constraints);
}
