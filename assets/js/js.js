var zkPopupOnClose = false;
var zkPopupOldParent = false;
var zkPopupDefaultOptions = {
	'top': false,
	'left': false,
	'width': false,
	'height': false,
	'background': '#FFF',
	'border-radius': '4px',
	'padding': '15px',
	'showCover': true,
	'showClose': true,
	'safeMargin': 40,
	'onClose': false,
	'closeOnCoverClick': true,
	'onLoad': false,
	'clone': false,
	'observe-content': true
};
var zkPopupCurrentOptions = {};

function zkPopup(content, options) {
	if (typeof options === 'undefined')
		options = {};

	let defOptions = JSON.parse(JSON.stringify(zkPopupDefaultOptions));
	options = array_merge(defOptions, options);

	let popup, cover;

	zkPopupOnClose = options['onClose'];
	if (_('popup-real') && _('popup-cover')) {
		options['already-existing'] = true;

		cover = _('popup-cover');
		popup = _('popup-real');
		popup.loading();
	} else {
		options['already-existing'] = false;

		if (options['showCover']) {
			cover = document.createElement('div');
			cover.className = 'zkPopupBg';
			cover.id = 'popup-cover';
			cover = document.body.appendChild(cover);
			if (options['closeOnCoverClick']) {
				cover.onclick = function () {
					zkPopupClose();
				};
			}
			cover.loading();
			let wHeight = window.innerHeight || document.body.clientHeight;
			cover.style.paddingTop = (wHeight / 2 - 20) + 'px';
		}

		popup = document.createElement('div');
		popup.className = 'zkPopup no-transition';
		popup.id = 'popup-real';
		popup.style.opacity = 0;
		popup = document.body.appendChild(popup);
	}

	if (!options['background'])
		options['background'] = 'none';
	popup.style.background = options['background'];
	if (!options['background'])
		popup.style.boxShadow = 'none';
	popup.style.borderRadius = options['border-radius'];
	popup.style.padding = options['padding'];

	zkPopupCurrentOptions = options;

	let promise;
	if (typeof content === 'object') {
		let get = {}, post = {};
		if (typeof content.get !== 'undefined')
			get = content.get;
		if (typeof content.post !== 'undefined')
			post = content.post;

		promise = ajax(content.url, get, post).then(r => fillPopup(r, options));
	} else {
		if (content.charAt(0) === '#' && (contentDiv = _(content.substr(1)))) {
			if (options['clone']) {
				popup.innerHTML = contentDiv.innerHTML;
			} else {
				zkPopupOldParent = contentDiv;
				while (contentDiv.childNodes.length) {
					popup.appendChild(contentDiv.firstChild);
				}
			}
			promise = fillPopup(false, options);
		} else {
			promise = fillPopup(content, options);
		}
	}

	if (options['observe-content'] && typeof MutationObserver !== 'undefined')
		(new MutationObserver(() => fillPopup())).observe(popup, {"childList": true, "subtree": true});

	return promise.then(changedHtml);
}

function fillPopup(r, options) {
	return new Promise(function (resolve) {
		let cover = _('popup-cover');
		let popup = _('popup-real');
		if (!popup) {
			resolve(false);
			return;
		}

		if (typeof options === 'undefined')
			options = {};

		let defOptions = JSON.parse(JSON.stringify(zkPopupDefaultOptions));
		let tempOptions = array_merge(defOptions, zkPopupCurrentOptions);
		options = array_merge(tempOptions, options);

		options['already-existing'] = false;

		if (typeof r === 'undefined' || r === null) {
			r = false;
			options['already-existing'] = true;
		}

		if (cover)
			cover.innerHTML = '';
		if (r !== false)
			popup.jsFill(r);

		if (!options['already-existing'] && window.innerWidth >= 768) {
			let input = popup.querySelector('input:not([type="hidden"])');
			if (input) {
				input.focus();
				if (input.select)
					input.select();
			} else {
				var textarea = popup.querySelector('textarea');
				if (textarea) {
					textarea.focus();
					textarea.select();
				}
			}
		}

		if (options['onLoad'] && !options['already-existing'])
			options['onLoad'].call(null);

		let wWidth = window.innerWidth || document.body.clientWidth;
		let wHeight = window.innerHeight || document.body.clientHeight;

		popup.className = 'zkPopup no-transition';

		let oldTop, oldLeft, oldWidth, oldHeight;
		if (options['already-existing']) {
			oldTop = popup.style.top;
			oldLeft = popup.style.left;
			oldWidth = popup.offsetWidth;
			oldHeight = popup.offsetHeight;
			popup.style.top = '0px';
			popup.style.left = '0px';
		}

		let width, height, top, left;

		if (options['width'] === false) {
			popup.style.width = 'auto';
			width = popup.offsetWidth + 2; // Adding avoids subpixels-related issue
		} else {
			width = options['width'];

			if (isNaN(options['width'])) {
				if (width.substr(-1) === '%')
					width = parseFloat(width);

				if (!isNaN(width))
					width = wWidth / 100 * width;
				else
					console.error('Popup error: invalid width.');
			} else {
				width = options['width'];
			}
		}

		let widthToSubtract = options['safeMargin'];
		if (options['left'])
			widthToSubtract = options['safeMargin'] / 2 + options['left'];

		let correctedWidth = false;
		if (width > wWidth - widthToSubtract) {
			width = wWidth - widthToSubtract;
			correctedWidth = true;
		}

		if (options['left'] === false)
			left = Math.round((wWidth - width) / 2);
		else
			left = options['left'];

		if (!correctedWidth && options['width'] === false)
			width = 'auto';

		if (options['height'] === false) {
			popup.style.height = 'auto';
			height = popup.offsetHeight + 2; // Adding avoids subpixels-related issue
		} else {
			if (isNaN(options['height'])) {
				height = options['height'];
				if (height.substr(-1) === '%')
					height = parseFloat(height);

				if (!isNaN(height))
					height = wHeight / 100 * height;
				else
					console.error('Popup error: invalid height.');
			} else {
				height = options['height'];
			}
		}

		let heightToSubtract = options['safeMargin'];
		if (options['top'])
			heightToSubtract = options['safeMargin'] / 2 + options['top'];

		let correctedHeight = false;
		if (height > wHeight - heightToSubtract) {
			height = wHeight - heightToSubtract;
			correctedHeight = true;
		}

		if (options['top'] === false)
			top = Math.round((wHeight - height) / 2);
		else
			top = options['top'];

		if (!correctedHeight && options['height'] === false)
			height = 'auto';

		if (options['already-existing']) {
			if (width !== 'auto')
				popup.style.width = oldWidth + 'px';
			if (height !== 'auto')
				popup.style.height = oldHeight + 'px';
		} else {
			popup.style.transform = 'scale(0)';
		}

		if (oldTop)
			popup.style.top = oldTop;
		if (oldLeft)
			popup.style.left = oldLeft;
		popup.offsetWidth; // Reflow
		popup.className = 'zkPopup';

		popup.style.width = width === 'auto' ? width : width + 'px';
		popup.style.height = height === 'auto' ? height : height + 'px';
		popup.style.top = top + 'px';
		popup.style.left = left + 'px';

		if (!options['already-existing']) {
			popup.style.transform = 'scale(1)';
			popup.style.opacity = 1;
		}

		if (options['showClose']) {
			setTimeout(function () {
				if (popup = _('popup-real'))
					popup.style.overflowY = 'auto';
				makeCloseButton();
			}, 500);
		}

		setTimeout(resolve, 400);
	});
}

function zkPopupClose(skipOnClose) {
	var popup = _('popup-real');
	if (!popup)
		return false;
	if (typeof skipOnClose == 'undefined')
		skipOnClose = false;

	if (zkPopupOnClose && !skipOnClose) {
		var conf = zkPopupOnClose.call(null);
		if (conf === false)
			return false;
	}
	if (zkPopupOldParent) {
		while (popup.childNodes.length) {
			zkPopupOldParent.appendChild(popup.firstChild);
		}
		zkPopupOldParent = false;
	}

	if (_('popup-cover'))
		document.body.removeChild(_('popup-cover'));
	if (_('zkPopupClose'))
		document.body.removeChild(_('zkPopupClose'));
	document.body.removeChild(popup);

	zkPopupCurrentOptions = {};
}

window.addEventListener('keydown', function (event) {
	switch (event.keyCode) {
		case 27:
			if (_('popup-real')) {
				zkPopupClose();
				event.stopImmediatePropagation();
				return false;
			}
			break;
	}
});

function makeCloseButton() {
	var popup = _('popup-real');
	if (!popup)
		return false;

	var close = _('zkPopupClose');
	if (!close) {
		close = document.createElement('div');
		close.id = 'zkPopupClose';
		close.className = 'zkPopupClose';
		close.innerHTML = '<a href="#" onclick="zkPopupClose(); return false"><img src="' + PATHBASE + 'model/Popup/assets/img/close.png" alt="" /></a>';
		document.body.appendChild(close);
	}

	var left = parseInt(popup.style.left) + popup.offsetWidth - 17;
	var top = parseInt(popup.style.top) - 25;
	if (top < 0)
		top = 0;
	if ((left + 60) >= window.innerWidth)
		left = window.innerWidth - 58;
	close.style.left = left + 'px';
	close.style.top = top + 'px';
}

window.addEventListener('resize', function () {
	fillPopup();
});
