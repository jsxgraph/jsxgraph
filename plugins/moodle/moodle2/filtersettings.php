<?php
/**
 * Version details
 *
 * @package    jsxgraph filter
 * @copyright  2016 Michael Gerhaeuser, Matthias Ehmann, Carsten Miller, Alfred Wassermann <alfred.wassermann@uni-bayreuth.de>
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
