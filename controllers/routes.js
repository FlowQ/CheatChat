/*
 * GET home page.
 */

exports.index = function(req, res){
  console.log('desktop');
  res.render('index', { isMobile: false} );
};


exports.mobile = function(req, res){
  console.log('mobile');
  res.render('index', { isMobile: true} );
};