$(document).ready(function() {
	var path = $UNIT_TEST_CONFIG.needPath ? 'class/' : '';
	$UNIT_TEST_SCRIPT_LOADER
		.script(path + 'class-basic.js').wait()
		.script(path + 'class-usage.js').wait()
		.script(path + 'mixin-basic.js').wait()
		.script(path + 'mixin-usage.js').wait()
		.script(path + 'metaclass.js').wait()
		.script(path + 'parent.js').wait()
		.script(path + 'prototype-basic.js').wait()
		.script(path + 'type-class.js').wait()
});
