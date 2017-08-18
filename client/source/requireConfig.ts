/// <reference path="../node_modules/@types/requirejs/index.d.ts" />
require.config({
	paths:{
		"jquery":"../node_modules/jquery/dist/jquery",
		"underscore":"../node_modules/underscore/underscore",
        "socket.io-client":"../node_modules/socket.io-client/socket.io",
        "async":"../node_modules/async/dist/async"
	}
});


require(["index"]);