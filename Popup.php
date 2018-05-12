<?php namespace Model\Popup;

use Model\Core\Module;

class Popup extends Module
{
	/**
	 * @param array $options
	 * @throws \Model\Core\Exception
	 */
	public function init(array $options)
	{
		if (!$this->model->isLoaded('FrontEnd'))
			$this->model->load('FrontEnd');
	}
}
