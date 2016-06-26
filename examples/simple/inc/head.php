<?php
global $ajax;
$ajax = (isset($_GET['ajax']))? $_GET['ajax'] : false;
if(!$ajax):
?>
<!doctype html>
<html>
<head>
<title>sal example</title>
<link rel='stylesheet' href='<?php echo $baseC ?>/style.css' type='text/css' media='all' />
<script type='text/javascript' src='<?php echo $baseC ?>/../../sal.js'></script>
<script type='text/javascript' src='<?php echo $baseC ?>/js/main.js'></script>
</head>
<body>
	<div id="container">
		<header>
			<ul id="mainMenu">
				<li><a class="ajaxLoad" href="<?php echo $baseC ?>/" targetid="main">home</a></li>
				<li><a class="ajaxLoad" href="<?php echo $baseC ?>/section1/" targetid="main">section1</a></li>
				<li><a class="ajaxLoad" href="<?php echo $baseC ?>/section2/" targetid="main">section2</a></li>
			</ul>
		</header>
		
<?php endif; ?>