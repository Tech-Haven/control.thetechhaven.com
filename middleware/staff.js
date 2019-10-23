// Middleware function
// DESC:  Check if  user is an authorized staff member. If they have a Staff, Root, or Server Admin role.

const { getGuildMember, getStaffRoles } = require('../utils/utils');

module.exports = async (req, res, next) => {
  if (!req.session.access_token) {
    return res
      .status(401)
      .json({ errors: [{ msg: `Unauthorized. Please login.` }] });
  }
  try {
    // guildMember object contains an array of role IDs
    const guildMember = await getGuildMember(req.session.discordId);

    if (guildMember.error) {
      return res.status(guildMember.error.status).json(guildMember);
    }
    // staffRoles array contains role object with ID and name
    const staffRoles = await getStaffRoles();
    const isStaff = staffRoles.some(r => {
      return guildMember.roles.includes(r.id);
    });
    if (!isStaff) {
      return res
        .status(401)
        .json({
          error: { status: '401', msg: '401: Unauthorized. Staff only.' }
        });
    }
    next();
  } catch (err) {
    res.status(500).json('Server error');
    console.error(err);
  }
};
