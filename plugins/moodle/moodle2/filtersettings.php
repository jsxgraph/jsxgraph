<?php

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * @package    jsxgraph filter
 * @copyright  2013 Alfred Wassermann <alfred.wassermann@uni-bayreuth.de>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {

    $settings->add(new admin_setting_configtext('filter_jsxgraph_divid',
        get_string('divid', 'filter_jsxgraph'),
        get_string('divid_desc', 'filter_jsxgraph'), 'box'));

    $settings->add(new admin_setting_configtext('filter_jsxgraph_boardvar',
        get_string('boardvar', 'filter_jsxgraph'),
        get_string('boardvar_desc', 'filter_jsxgraph'), 'board'));

    $settings->add(new admin_setting_configtext('filter_jsxgraph_width',
        get_string('width', 'filter_jsxgraph'),
        get_string('width_desc', 'filter_jsxgraph'), '500', PARAM_INT));

    $settings->add(new admin_setting_configtext('filter_jsxgraph_height',
        get_string('height', 'filter_jsxgraph'),
        get_string('height_desc', 'filter_jsxgraph'), '400', PARAM_INT));
        
}
