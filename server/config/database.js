module.exports = {
  secret: 'devdacticIsAwesome',
  database:
    process.env.DATABASE ||
    'mongodb://shlomoariel:a1345678@ds153413.mlab.com:53413/user-management',
};
