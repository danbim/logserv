import config from 'config';
import routes from './common/routes.js';

export default `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${config.get('title')}</title>
  <link href="${routes.asset('static/css/styles.css')}" rel="stylesheet">
  <!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
  <!-- WARNING: Respond.js doesn\'t work if you view the page via file:// -->
  <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
  <![endif]-->
  <script>
    window.logserv_contextPath = "${config.get('contextPath')}";
  </script>
  <script src="${routes.asset('static/js/App.js')}"></script>
</head>
<body>
</body>
</html>
`;
