/* 
 GeoGebra - Dynamic Mathematics for Everyone
 http://www.geogebra.org

 This file is part of GeoGebra.

 This program is free software; you can redistribute it and/or modify it 
 under the terms of the GNU General Public License as published by 
 the Free Software Foundation.
 
 */

package geogebra.export;

import geogebra.GeoGebra;
import geogebra.euclidian.EuclidianView;
import geogebra.gui.TitlePanel;
import geogebra.gui.view.algebra.InputPanel;
import geogebra.kernel.Construction;
import geogebra.kernel.Kernel;
import geogebra.main.Application;
import geogebra.main.GeoGebraPreferences;
import geogebra.main.GuiManager;
import geogebra.util.DownloadManager;
import geogebra.util.Util;

import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Rectangle;
import java.awt.Toolkit;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.StringSelection;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URL;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.ButtonGroup;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JRadioButton;
import javax.swing.JTabbedPane;
import javax.swing.JTextArea;

/**
 * Dialog which provides for exporting into an HTML page 
 * enriched with an Applet.
 * 
 * @author Markus Hohenwarter
 * @author Philipp Weissenbacher (materthron@users.sourceforge.net)
 */
public class WorksheetExportDialog extends JDialog {

	private static final long serialVersionUID = 1L;

	private static final int BUTTON_WIDTH = 200;
	private static final int BUTTON_HEIGHT = 40;
	private static final int DEFAULT_HTML_PAGE_WIDTH = 600;
	private static final int DEFAULT_APPLET_WIDTH = 600;
	private static final int DEFAULT_APPLET_HEIGHT = 500;	
	
	final private static int TYPE_HTMLFILE = 0;
	final private static int TYPE_HTMLCLIPBOARD = 1;
	final private static int TYPE_MEDIAWIKI = 2;
	final private static int TYPE_GOOGLEGADGET = 3;

	private Application app;
	private Kernel kernel;
	private InputPanel textAbove, textBelow;
	private JCheckBox cbShowFrame, cbEnableRightClick, cbEnableLabelDrags, cbShowResetIcon,
					cbShowMenuBar, cbSavePrint, cbShowToolBar, cbShowToolBarHelp, cbShowInputField,
					cbOfflineArchiveAndGgbFile;
	private JComboBox cbFileType;
	private JButton exportButton;
	private GraphicSizePanel sizePanel;
	private boolean useWorksheet = true, kernelChanged = false;			
	private JTabbedPane tabbedPane;
	private GeoGebraPreferences ggbPref;
	private GuiManager guiManager;

	public WorksheetExportDialog(Application app) {
		super(app.getFrame(), true);
		this.app = app;
		kernel = app.getKernel();
		
		ggbPref = GeoGebraPreferences.getPref();
		guiManager = app.getGuiManager();
		
		initGUI();					
	} 
		
	
	/**
	 * Checks if the EuclidianView has a selected rectangle. 
	 * In this case we will automatically move the coord system
	 * to put the selection rectangle into the upper left
	 * corner of the euclidian view.
	 */
	private void checkEuclidianView() {
		EuclidianView ev = app.getEuclidianView();
		
		// 1) selection rectangle
		Rectangle rect = ev.getSelectionRectangle();
		if (rect != null) {
			double xZero = ev.getXZero() - rect.x;
			double yZero = ev.getYZero() - rect.y;
			rect.x = 0;
			rect.y = 0;			
			ev.setCoordSystem(xZero, yZero, ev.getXscale(), ev.getYscale(), true);

			// update size panel
			int width = sizePanel.getSelectedWidth() - (ev.getWidth() - rect.width);
			int height = sizePanel.getSelectedHeight() - (ev.getHeight() - rect.height);
			sizePanel.setValues(width, height, false);												
		}
	}

	private void initGUI() {	
		
		// title, author, date
		TitlePanel tp = new TitlePanel(app);
		ActionListener kernelChangedListener = new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				kernelChanged = true;
			}
		};
		tp.addActionListener(kernelChangedListener);
		tp.setBorder(BorderFactory.createEmptyBorder(10,10,10,10));

		tabbedPane = new JTabbedPane();
		tabbedPane.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
		tabbedPane.addTab(app.getMenu("General"), createGeneralSettingsTab());
		tabbedPane.addTab(app.getMenu("Advanced"), createAdvancedSettingsTab());

		// Cancel and Export Button
		JButton cancelButton = new JButton(app.getPlain("Cancel"));
		cancelButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				setVisible(false);
			}
		});

		exportButton = new JButton(app.getMenu("Export"));
		exportButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {				
				Thread runner = new Thread() {
					public void run() {
						setVisible(false);
						if (kernelChanged)
							app.storeUndoInfo();
						
						int type = cbFileType.getSelectedIndex();
						
						// index 0 = file + html
						if ( type == TYPE_HTMLFILE)
							exportHTMLtoFile();
						else
							//index 1 = clipboard + html
							// index 2 = clipboard + mediawiki
							// index 3 = clipboard + google gadget
							try {
								exportToClipboard(cbFileType.getSelectedIndex());
								
								if (type == TYPE_GOOGLEGADGET) {
									// open Google Gadgets Editor
									app.getGuiManager().showURLinBrowser("http://code.google.com/apis/gadgets/docs/tools.html#GGE");
								}
							} catch (Exception e) {
			    				app.showError("SaveFileFailed");
			    				Application.debug(e.toString());					
							}
					}
				};
				runner.start();
			}
		});
		
		/*
		JButton clipboardButton = new JButton(app.getMenu("Clipboard"));
		clipboardButton.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent e) {				
				Thread runner = new Thread() {
					public void run() {
						setVisible(false);
						if (kernelChanged)
							app.storeUndoInfo();
						
						Toolkit toolkit = Toolkit.getDefaultToolkit();
						Clipboard clipboard = toolkit.getSystemClipboard();
						StringSelection stringSelection = new StringSelection(getHTML(null));
						clipboard.setContents(stringSelection, null);

					}
				};
				runner.start();
			}
		});*/
		
		
		JPanel buttonPanel = new JPanel();
		buttonPanel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
		buttonPanel.setLayout(new BoxLayout(buttonPanel, BoxLayout.X_AXIS));
		buttonPanel.add(Box.createHorizontalGlue());
		buttonPanel.add(exportButton);
		buttonPanel.add(Box.createRigidArea(new Dimension(5, 0)));
		//buttonPanel.add(clipboardButton);
		buttonPanel.add(Box.createRigidArea(new Dimension(5, 0)));
		buttonPanel.add(cancelButton);
		
		getContentPane().setLayout(new BorderLayout());
		getContentPane().add(tp, BorderLayout.NORTH);		
		getContentPane().add(tabbedPane, BorderLayout.CENTER);
		getContentPane().add(buttonPanel, BorderLayout.SOUTH);

		Util.registerForDisposeOnEscape(this);

		setTitle(app.getMenu("Export") + ": "
				+ app.getPlain("DynamicWorksheet") + " ("
				+ Application.FILE_EXT_HTML + ")");
		setResizable(false);
		centerOnScreen();
	}
	
	private void loadPreferences() {
		try {
			
			
	    	cbEnableRightClick.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_RIGHT_CLICK, "false")).booleanValue() );
	    	cbEnableLabelDrags.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_LABEL_DRAGS, "false")).booleanValue() );
	    	cbShowResetIcon.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_RESET_ICON, "false")).booleanValue() );
	    	cbShowFrame.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_FRAME_POSSIBLE, "false")).booleanValue() );
	    	
	    	cbShowMenuBar.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_SHOW_MENUBAR, "false")).booleanValue() );
	    	cbSavePrint.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_SAVE_PRINT, "false")).booleanValue() );
	    	
	    	cbShowToolBar.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_SHOW_TOOLBAR, "false")).booleanValue() );
	    	cbShowToolBarHelp.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_SHOW_TOOLBAR_HELP, "false")).booleanValue() );
	    	cbShowToolBarHelp.setEnabled(cbShowToolBar.isSelected());
	    	
	    	cbShowInputField.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			ggbPref.EXPORT_WS_SHOW_INPUT_FIELD, "false")).booleanValue() );
	    	
	    	//cbOfflineArchive.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    	//		GeoGebraPreferences.EXPORT_WS_OFFLINE_ARCHIVE, "false")).booleanValue() );
	    	cbOfflineArchiveAndGgbFile.setSelected( Boolean.valueOf(ggbPref.loadPreference(
	    			GeoGebraPreferences.EXPORT_WS_GGB_FILE, "false")).booleanValue() );
	    	addHeight();
	    
		} catch (Exception e) {
			e.printStackTrace();
		}
    }
	
	private void addHeight() {
		int height = 0;
		
		if (cbShowToolBar.isSelected()) {
			height += guiManager.getToolBarHeight();			
		}
		if (cbShowMenuBar.isSelected()) {
			height += guiManager.getMenuBarHeight();
		}
		if (cbShowInputField.isSelected()) {
			height +=guiManager.getAlgebraInputHeight();
		}
		
		sizePanel.setValues(sizePanel.getSelectedWidth(), 
				sizePanel.getSelectedHeight() + height, 
				false);
	}
    
    private void savePreferences() {    	    	
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_RIGHT_CLICK, Boolean.toString(cbEnableRightClick.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_LABEL_DRAGS, Boolean.toString(cbEnableLabelDrags.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_RESET_ICON, Boolean.toString(cbShowResetIcon.isSelected()));    	    	
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_FRAME_POSSIBLE, Boolean.toString(cbShowFrame.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_SHOW_MENUBAR, Boolean.toString(cbShowMenuBar.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_SHOW_TOOLBAR, Boolean.toString(cbShowToolBar.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_SHOW_TOOLBAR_HELP, Boolean.toString(cbShowToolBarHelp.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_SHOW_INPUT_FIELD, Boolean.toString(cbShowInputField.isSelected()));    
    	//ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_OFFLINE_ARCHIVE, Boolean.toString(cbOfflineArchive.isSelected()));        
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_SAVE_PRINT, Boolean.toString(cbSavePrint.isSelected()));
    	ggbPref.savePreference(GeoGebraPreferences.EXPORT_WS_GGB_FILE, Boolean.toString(cbOfflineArchiveAndGgbFile.isSelected()));        
    }

	/**
	 * The General Settings Tab contains some of the more general settings.
	 */
	private JPanel createGeneralSettingsTab() {
		JPanel tab = new JPanel(new BorderLayout(5, 5));
		tab.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
		
		// text areas
		JPanel centerPanel = new JPanel(new BorderLayout(5, 5));
		JLabel label = new JLabel(app.getPlain("TextBeforeConstruction") + ":");
		textAbove = new InputPanel(null, app, 5, 40, true, true, false);				
		//JScrollPane scrollPane = new JScrollPane(textAbove);

		JPanel p = new JPanel(new BorderLayout());
		p.add(label, BorderLayout.NORTH);
		p.add(textAbove, BorderLayout.CENTER);
		centerPanel.add(p, BorderLayout.NORTH);

		label = new JLabel(app.getPlain("TextAfterConstruction") + ":");
		textBelow = new InputPanel(null, app, 8, 40, true, true, false);	
		//scrollPane = new JScrollPane(textBelow);
		p = new JPanel(new BorderLayout());
		p.add(label, BorderLayout.NORTH);
		p.add(textBelow, BorderLayout.CENTER);
		centerPanel.add(p, BorderLayout.SOUTH);

		// set line wrapping
		JTextArea ta =  (JTextArea) textAbove.getTextComponent();
		ta.setLineWrap(true);
		ta.setWrapStyleWord(true);
		
		ta =  (JTextArea) textBelow.getTextComponent();
		ta.setLineWrap(true);
		ta.setWrapStyleWord(true);

		// init text areas
		Construction cons = kernel.getConstruction();
		String text = cons.getWorksheetText(0);
		if (text.length() > 0)
			textAbove.setText(text);
		text = cons.getWorksheetText(1);
		if (text.length() > 0)
			textBelow.setText(text);

		// action listener for radio buttons
		ActionListener lst = new ActionListener() {
			public void actionPerformed(ActionEvent e) {
				String cmd = e.getActionCommand();
				useWorksheet = cmd.equals("worksheet");
				updateEnabledStates();
			}
		};

		// applet panel:
		// radio buttons for dynamic worksheet and open button
		JPanel appletPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 5));

		appletPanel.setBorder(BorderFactory.createEtchedBorder());
		ButtonGroup bg = new ButtonGroup();
		JRadioButton rb = new JRadioButton(app.getPlain("DynamicWorksheet"));
		rb.setActionCommand("worksheet");
		rb.addActionListener(lst);
		rb.setSelected(true);
		bg.add(rb);
		appletPanel.add(rb);
		
		appletPanel.add(Box.createHorizontalGlue());

		// open button
		rb = new JRadioButton(app.getPlain("OpenButton"));
		rb.setActionCommand("openButton");
		rb.addActionListener(lst);
		bg.add(rb);			
		appletPanel.add(rb);
		
		centerPanel.add(appletPanel, BorderLayout.CENTER);
		tab.add(centerPanel, BorderLayout.CENTER);		

		return tab;
	}

	private JPanel createAdvancedSettingsTab() {
		JPanel tab = new JPanel();
		tab.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
		//tab.setLayout(new BoxLayout(tab, BoxLayout.Y_AXIS));
		tab.setLayout(new BorderLayout(5,5));
				
		// functionality panel
		JPanel funcPanel = new JPanel();
		funcPanel.setBorder(BorderFactory.createTitledBorder(app.getMenu("Functionality")));
		funcPanel.setLayout(new BoxLayout(funcPanel, BoxLayout.Y_AXIS));
		tab.add(funcPanel, BorderLayout.WEST);				
		
		// enable right click
		cbEnableRightClick = new JCheckBox(app.getMenu("EnableRightClick"));	
		cbEnableRightClick.setEnabled(true);
		funcPanel.add(cbEnableRightClick);	
		

		// enable label drags
		cbEnableLabelDrags = new JCheckBox(app.getMenu("EnableLabelDrags"));	
		cbEnableLabelDrags.setEnabled(true);
		funcPanel.add(cbEnableLabelDrags);	
		
		// showResetIcon
		cbShowResetIcon = new JCheckBox(app.getMenu("ShowResetIcon"));		
		funcPanel.add(cbShowResetIcon);
		
		// framPossible
		cbShowFrame = new JCheckBox(app.getPlain("DoubleClickToOpen"));		
		funcPanel.add(cbShowFrame);
		funcPanel.add(Box.createVerticalGlue());
		
		// GUI panel
		JPanel guiPanel = new JPanel();
		guiPanel.setLayout(new BoxLayout(guiPanel, BoxLayout.Y_AXIS));
		guiPanel.setBorder(BorderFactory.createTitledBorder(app.getMenu("UserInterface")));
		tab.add(guiPanel, BorderLayout.EAST);
		
		// two columns
		JPanel guiPanelWest = new JPanel();
		guiPanelWest.setLayout(new BoxLayout(guiPanelWest, BoxLayout.Y_AXIS));
		JPanel guiPanelEast = new JPanel();
		guiPanelEast.setLayout(new BoxLayout(guiPanelEast, BoxLayout.Y_AXIS));
		JPanel twoColumns = new JPanel();
		twoColumns.setLayout(new BorderLayout());
		twoColumns.add(guiPanelEast, BorderLayout.EAST);
		twoColumns.add(guiPanelWest, BorderLayout.WEST);
		twoColumns.setAlignmentX(LEFT_ALIGNMENT);
		guiPanel.add(twoColumns);
		
		// left column
		// showMenuBar
		cbShowMenuBar = new JCheckBox(app.getMenu("ShowMenuBar"));		
		guiPanelWest.add(cbShowMenuBar);
		// showToolBar
		cbShowToolBar = new JCheckBox(app.getMenu("ShowToolBar"));		
		guiPanelWest.add(cbShowToolBar);
		// showAlgebraInput
		cbShowInputField = new JCheckBox(app.getMenu("ShowInputField"));
		guiPanelWest.add(cbShowInputField);
		
		// right column
		// save, print
		cbSavePrint = new JCheckBox(app.getMenu("Save") + ", " + app.getMenu("Print"));
		guiPanelEast.add(cbSavePrint);
		// showToolBarHelp				
		cbShowToolBarHelp = new JCheckBox(app.getMenu("ShowToolBarHelp"));
		cbShowToolBarHelp.setEnabled(cbShowToolBar.isSelected());
		guiPanelEast.add(cbShowToolBarHelp);
		
		
		// width and height of applet, info about double clicking
		int width, height;
		JPanel appCP = app.getCenterPanel();
		if (appCP != null) {
			width = appCP.getWidth();
			height = appCP.getHeight();
		} else {
			width = DEFAULT_APPLET_WIDTH;
			height = DEFAULT_APPLET_HEIGHT;
		}		
		sizePanel = new GraphicSizePanel(app, width, height, false);
		sizePanel.setAlignmentX(LEFT_ALIGNMENT);
		guiPanel.add(sizePanel);
		
		// Applet panel
		JPanel appletPanel = new JPanel();
		appletPanel.setBorder(BorderFactory.createTitledBorder(app.getMenu("Files")));
		appletPanel.setLayout(new BoxLayout(appletPanel, BoxLayout.X_AXIS));
		tab.add(appletPanel, BorderLayout.SOUTH);
		
		// ggb file or base64
		cbOfflineArchiveAndGgbFile = new JCheckBox("ggb " + app.getMenu("File") + " & jar " + app.getMenu("Files"));		
		appletPanel.add(cbOfflineArchiveAndGgbFile);
		
		// file type (file/clipboard, mediaWiki)
		String fileTypeStrings[] = {app.getMenu("File")+": html",app.getMenu("Clipboard")+": html",app.getMenu("Clipboard")+": MediaWiki",app.getMenu("Clipboard")+": Google Gadget" };
		cbFileType = new JComboBox(fileTypeStrings);
		cbFileType.setEnabled(true);
		JPanel secondLine2 = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 5));				
		//secondLine2.add(new JLabel(app.getPlain("AxisLabel") + ":"));
		secondLine2.add(cbFileType);
		appletPanel.add(secondLine2);	
		
		
		cbFileType.addActionListener (new ActionListener () {
		    public void actionPerformed(ActionEvent e) {
		    	
		    	if (exportButton != null)
			        if (cbFileType.getSelectedIndex() == TYPE_HTMLFILE) {
			        	exportButton.setLabel(app.getMenu("Export"));
			        }
			        else
			        {
			        	exportButton.setLabel(app.getMenu("Clipboard"));
			        }
		    }
		});

		/*
		// to load a ggb file we need a signed jar (cbSavePrint) or 
		// offline jar files
		cbGgbFile.addActionListener(new ActionListener() {
			public void actionPerformed(ActionEvent ae) {
				if (cbGgbFile.isSelected() && !cbSavePrint.isSelected()) {
					cbOfflineArchive.setSelected(true);
				}
			}
		});
		
		// use archive from geogebra.org?
		cbOfflineArchive = new JCheckBox("jar " + app.getMenu("Files"));
		appletPanel.add(cbOfflineArchive);*/
		
		ActionListener heightChanger = new ActionListener() {
			public void actionPerformed(ActionEvent ae) {
				JCheckBox src = (JCheckBox) ae.getSource();				
				
				int heightChange = 0;
				if (src == cbShowToolBar) {
					heightChange = guiManager.getToolBarHeight();
					if (!cbShowToolBarHelp.isSelected())
						cbShowToolBarHelp.setSelected(false);
					cbShowToolBarHelp.setEnabled(cbShowToolBar.isSelected());
				}
				else if (src == cbShowInputField) {
					heightChange = guiManager.getAlgebraInputHeight();
				}
				
				if (!src.isSelected())
					heightChange = -heightChange;
				
				sizePanel.setValues(sizePanel.getSelectedWidth(), 
									sizePanel.getSelectedHeight() + heightChange, 
									false);
			}
		};
		
		cbShowToolBar.addActionListener(heightChanger);
		cbShowMenuBar.addActionListener(heightChanger);
		cbShowInputField.addActionListener(heightChanger);
		
		return tab;
	}
	


	public void setVisible(boolean flag) {
		if (flag) {
			checkEuclidianView();
			loadPreferences();
			super.setVisible(true);
		} else {
			// store the texts of the text ares in
			// the current construction
			Construction cons = kernel.getConstruction();
			cons.setWorksheetText(textAbove.getText(), 0);
			cons.setWorksheetText(textBelow.getText(), 1);
		
			savePreferences();
			super.setVisible(false);
		}		
	}

	private void updateEnabledStates() {				
		tabbedPane.setEnabledAt(1, useWorksheet);
	}

	private void centerOnScreen() {
		pack();
		setLocationRelativeTo(app.getMainComponent());
	}
	
	private void exportToClipboard(int type) throws IOException {
		Toolkit toolkit = Toolkit.getDefaultToolkit();
		Clipboard clipboard = toolkit.getSystemClipboard();
		StringSelection stringSelection = null;
		
		switch (type) {
		case TYPE_HTMLCLIPBOARD:
			stringSelection = new StringSelection(getHTML(null));
			break;
			
		case TYPE_MEDIAWIKI:
			stringSelection = new StringSelection(getMediaWiki());
			break;
			
		case TYPE_GOOGLEGADGET:
			stringSelection = new StringSelection(getGoogleGadget());
		break;
		}
		
		clipboard.setContents(stringSelection, null);

	}

	/**
	 * Exports construction as html worksheet and returns success state
	 */
	private void exportHTMLtoFile() {
		File htmlFile = null;

		File currFile = Application.removeExtension(app.getCurrentFile());
		if (currFile != null)
			htmlFile = Application
					.addExtension(currFile, Application.FILE_EXT_HTML);

		htmlFile = guiManager.showSaveDialog(Application.FILE_EXT_HTML, htmlFile, app
				.getPlain("html")
				+ " " + app.getMenu("Files"));
		if (htmlFile == null)
			return;
		
		try {
			// save construction file
			// as worksheet_file.ggb
			File ggbFile = null;
			if (cbOfflineArchiveAndGgbFile.isSelected()) {
				String ggbFileName = Application.removeExtension(htmlFile).getName()
						+ ".ggb";
				ggbFile = new File(htmlFile.getParent(), ggbFileName);
				app.getXMLio().writeGeoGebraFile(ggbFile);
			}

			// write html string to file
			FileWriter fw = new FileWriter(htmlFile);
			fw.write(getHTML(ggbFile));
			fw.close();

			final File HTMLfile = htmlFile;
			// copy files and open browser
			Thread runner = new Thread() {
	    		public void run() {    
	    			try {
		    			//copy jar to same directory as ggbFile
	    				if (cbOfflineArchiveAndGgbFile.isSelected()) {	
	    					// copy all jar files
	    					copyJarsTo(getAppletCodebase(), HTMLfile.getParent());
	    				}
	    				
		    			// open html file in browser
	    				guiManager.showURLinBrowser(HTMLfile.toURL());
	    			} catch (Exception ex) {			
	    				app.showError("SaveFileFailed");
	    				Application.debug(ex.toString());
	    			} 
	    		}
			};
			runner.start();
						
		} catch (Exception ex) {			
			app.showError("SaveFileFailed");
			Application.debug(ex.toString());
		} 
	}
	
	/**
	 * Returns the code base for exported applet depending on 
	 * whether a signed or unsigned applet is needed for the options set.
	 */
	private URL getAppletCodebase() {
		URL codebase = app.getCodeBase();
		if (!cbSavePrint.isSelected()) {
			try {
				codebase = new URL(app.getCodeBase(), "unsigned/");
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		return codebase;
	}
	
	/**
	 * Copies all jar files to the given destination directory.
	 */
	public synchronized void copyJarsTo(URL codeBase, String destDir) throws Exception {
		for (int i=0; i < Application.JAR_FILES.length; i++) {
			// jar file
			URL src = new URL(codeBase, Application.JAR_FILES[i]);
			File dest = new File(destDir, Application.JAR_FILES[i]);
			DownloadManager.copyURLToFile(src, dest);
			
			// jar.pack.gz file
//			try {
//				src = new URL(codeBase, Application.JAR_FILES[i] + ".pack.gz");
//				dest = new File(destDir, Application.JAR_FILES[i] + ".pack.gz");
//				DownloadManager.copyURLToFile(src, dest);
//			} catch (Exception e) {
//				System.err.println("could not copy: " + Application.JAR_FILES[i] + ".pack.gz");
//			}
		}
	}
	
//	private void packFile(File jarFile) {
//		Packer packer = Pack200.newPacker();
//		
//	    // Initialize the state by setting the desired properties
//	    Map p = packer.properties();
//	    // take more time choosing codings for better compression
//	    p.put(Packer.EFFORT, "7");  // default is "5"
//	    // use largest-possible archive segments (>10% better compression).
//	    p.put(Packer.SEGMENT_LIMIT, "-1");
//	    // reorder files for better compression.
//	    p.put(Packer.KEEP_FILE_ORDER, Packer.FALSE);
//	    // smear modification times to a single value.
//	    p.put(Packer.MODIFICATION_TIME, Packer.LATEST);
//	    // ignore all JAR deflation requests,
//	    // transmitting a single request to use "store" mode.
//	    p.put(Packer.DEFLATE_HINT, Packer.FALSE);
//	    // discard debug attributes
//	    p.put(Packer.CODE_ATTRIBUTE_PFX+"LineNumberTable", Packer.STRIP);
//	    // throw an error if an attribute is unrecognized
//	    p.put(Packer.UNKNOWN_ATTRIBUTE, Packer.ERROR);
//
//	    try {
//	        JarFile jarFile = new JarFile("/tmp/testref.jar");
//	        FileOutputStream fos = new FileOutputStream("/tmp/test.pack");
//	        // Call the packer
//	        packer.pack(jarFile, fos);
//	        jarFile.close();
//	        fos.close();
//	        
//	        File f = new File("/tmp/test.pack");
//	        FileOutputStream fostream = new FileOutputStream("/tmp/test.jar");
//	        JarOutputStream jostream = new JarOutputStream(fostream);
//	        Unpacker unpacker = Pack200.newUnpacker();
//	        // Call the unpacker
//	        unpacker.unpack(f, jostream);
//	        // Must explicitly close the output.
//	        jostream.close();
//	    } catch (IOException ioe) {
//	        ioe.printStackTrace();
//	    }
//	}
	
	private void appendBase64(StringBuffer sb) throws IOException {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		//try {
			app.getXMLio().writeGeoGebraFile(baos, false);
			sb.append(geogebra.util.Base64.encode(baos.toByteArray(), 0));
		//} catch (IOException e) {
		//	e.printStackTrace();
		//}

	}
	
	/*
	 * returns string like this:
	 * <ggb_applet width="585" height="470" ggbBase64="UEsDBBQACAAIAMWreDsAAAAAAAAAAAAAAAAMAAAAZ2VvZ2VicmEueG1srVM9b9swEJ2bX0FwbyzZFZAAkoMmU4C0Hdx26EaRZ4k1RQr8sOX++h5JyXYzdyLu3eO7d8dj/TQNihzBOml0Q8v7ghLQ3Aipu4YGv//4QJ+2d3UHpoPWMrI3dmC+oZv7NY14kNu7D7XrzYkwlSg/JZwaumfKASVutMCE6wH8PzgLk1SS2fO39jdw766JLPKqx4BVvA2I8UG8SbeEq1hwb7QnxMk/0NB1EbF6lbzUELiSQjId6yVvSCLkJIXvG1o9VJT0ILse5T6Vj1mNG2PF7uw8DGT6BdagaFnFWZxztMmR40xhwapIqdsoycBxB97j5BxhE7jFfmeluPQXg1f3bNQVGo3U/oWNPtg09c0M7fw56mMpG/1+1p2CGStxKD3wQ2umXZpBucnS389jupL8tN2LUcYSi+1U2Hc3n20+EycavbCKxCkSY9aIopd8+bhOjHS2+UwsJXW2NjdeLl2XxVJGOhKBOEVclmU2irWgGkpJ0NK/LYGX/HDtNPK/hqHFJb1dgYtk+Z8k69W73akPYDWovCEaHzaY4MiRqeXpkg8BXA4Y5sQ8EBYf6wcayKiAzsLiO294HlfKFrdb+A6uV4uJ6MGhV+7xq2I/PvYSf5LvDb7NF8l7Boo8G4urYYWjRDAfKVHk9m76K/N/3v4FUEsHCD5fkJDvAQAAAQQAAFBLAQIUABQACAAIAMWreDs+X5CQ7wEAAAEEAAAMAAAAAAAAAAAAAAAAAAAAAABnZW9nZWJyYS54bWxQSwUGAAAAAAEAAQA6AAAAKQIAAAAA" framePossible = "false" showResetIcon = "true" showAnimationButton = "true" enableRightClick = "false" errorDialogsActive = "true" enableLabelDrags = "false" showMenuBar = "false" showToolBar = "true" showToolBarHelp = "true" showAlgebraInput = "false" />
	 * for insertion into MediaWiki
	 */
	private String getMediaWiki() throws IOException {
		StringBuffer sb = new StringBuffer();

		sb.append("<ggb_applet width=\"");
		sb.append(sizePanel.getSelectedWidth());
		sb.append("\" height=\"");
		sb.append(sizePanel.getSelectedHeight());
		sb.append("\" ");
		
		// GeoGebra version
		sb.append(" version=\"");
		sb.append(GeoGebra.SHORT_VERSION_STRING);
		sb.append("\" ");

		// base64 encoding
		sb.append("ggbBase64=\"");
		appendBase64(sb);
		/*
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		try {
			app.getXMLio().writeGeoGebraFile(baos, false);
			sb.append(geogebra.util.Base64.encode(baos.toByteArray(), 0));
		} catch (IOException e) {
			e.printStackTrace();
		}*/
		sb.append("\"");
	
		appendGgbAppletParameters(sb, TYPE_MEDIAWIKI);	
		
		sb.append(" />");
		
		return sb.toString();
		
	}

	private String getGoogleGadget() throws IOException {
		StringBuffer sb = new StringBuffer();

		sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n");
		sb.append("<Module>\n");
		sb.append("<ModulePrefs title=\"");
		Construction cons = kernel.getConstruction();
		String title = cons.getTitle();
		if (!title.equals("")) {
			sb.append(Util.toHTMLString(title));
		} else {
			sb.append("GeoGebra Gadget");
		}
		sb.append("\" height=\"");
		sb.append(sizePanel.getSelectedHeight());
		sb.append("\" width=\"");
		sb.append(sizePanel.getSelectedWidth());
		sb.append("\" scrolling=\"false\" ");
		sb.append("author=\"");
		sb.append(Util.toHTMLString(cons.getAuthor()));
		sb.append("\" author_email=\"xxx@google.com\" ");
		sb.append("description=\"GeoGebra applet as a Google-Site gadget\" thumbnail=\"http://www.geogebra.org/static/images/geogebra_logo67x60.png\">\n");
		sb.append("</ModulePrefs>\n");
		sb.append("<Content type=\"html\">\n");
		sb.append("<![CDATA[\n");
		sb.append("<script src=\"http://java.com/js/deployJava.js\">\n");
		sb.append("</script>\n");
		sb.append("<div id='ggbapplet'>\n");
		sb.append("<script>\n");
		sb.append("var jarUrl = \"geogebra.jar\";\n");
		//sb.append("var cachedJarUrl = _IG_GetCachedUrl(jarUrl);\n");

		
		sb.append("deployJava.runApplet({archive:jarUrl, name:\"ggbApplet\", code:\"geogebra.GeoGebraApplet\", codebase:\"");
		sb.append(GeoGebra.GEOGEBRA_ONLINE_ARCHIVE_BASE);
		sb.append("unsigned/");
		sb.append("\", width:\"");
		sb.append(sizePanel.getSelectedWidth());
		sb.append("\", height:\"");
		sb.append(sizePanel.getSelectedHeight());
		sb.append("\",\n");
		//sb.append("filename:\"xxx.ggb\",");
		sb.append("ggbBase64:\"");
		appendBase64(sb);
		sb.append("\",\n");
		//sb.append("java_arguments:\"-Xmx256m\", framePossible:\"true\", showResetIcon:\"true\", showAnimationButton:\"true\", enableRightClick:\"false\", enableLabelDrags:\"true\", showMenuBar:\"false\", showToolBar:\"false\", showToolBarHelp:\"false\", showAlgebraInput:\"false\"});\n");
		appendGgbAppletParameters(sb, TYPE_GOOGLEGADGET);			
		sb.setLength(sb.lastIndexOf(",")); // remove last comma
		sb.append("});\n");

		sb.append("</script>\n");
		sb.append("</div>\n");
		sb.append("]]>\n");
		sb.append("</Content>\n");
		sb.append("</Module>\n");
		
		return sb.toString();
		
	}

	/**
	 * Returns a html page with the applet included
	 * 
	 * @param ggbFile
	 *            construction File
	 */
	private String getHTML(File ggbFile) {
		StringBuffer sb = new StringBuffer();

		// applet width
		int appletWidth, appletHeight;
		if (!useWorksheet) { // change width and height for open button
			appletWidth = BUTTON_WIDTH;
			appletHeight = BUTTON_HEIGHT;
		} else {
			appletWidth = sizePanel.getSelectedWidth();
			appletHeight = sizePanel.getSelectedHeight();
		}

		// width for table
		int pageWidth = Math.max(appletWidth, DEFAULT_HTML_PAGE_WIDTH);
		
		// xhtml header
		// Michael Borcherds 2008-05-01
		// xhtml header
		// The declaration may be optionally omitted because it declares as its encoding the default encoding.
		// and casuses problems on some servers (when short php tags enabled)
		//sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
		sb.append("<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"\n");
		sb.append("\"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n");
		sb.append("<html xmlns=\"http://www.w3.org/1999/xhtml\">\n");

		sb.append("<head>\n");
		sb.append("<title>");
		Construction cons = kernel.getConstruction();
		String title = cons.getTitle();
		if (!title.equals("")) {
			sb.append(Util.toHTMLString(title));
			sb.append(" - ");
		}
		sb.append(Util.toHTMLString(app.getPlain("ApplicationName") + " "
				+ app.getPlain("DynamicWorksheet")));
		sb.append("</title>\n");
		// charset
		sb.append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />\n");
		// sb.append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=iso-8859-1\" />\n");
		
		sb.append("<meta name=\"generator\" content=\"GeoGebra\" />\n");
		String css = app.getSetting("cssDynamicWorksheet");
		if (css != null) {
			sb.append(css);
			sb.append("\n");
		}
		sb.append("</head>\n");

		sb.append("<body>\n");
		sb.append("<table border=\"0\" width=\"" + pageWidth + "\">\n");
		sb.append("<tr><td>\n");

		// header with title
		if (!title.equals("")) {
			sb.append("<h2>");
			sb.append(Util.toHTMLString(title));
			sb.append("</h2>\n");
		}

		// text before applet
		String text = textAbove.getText();
		if (text != null) {
			sb.append("<p>\n");
			sb.append(Util.toHTMLString(text));
			sb.append("</p>\n");
		}

		// includ applet tag
		sb.append("\n\n");
		sb.append(getAppletTag(ggbFile, appletWidth, appletHeight));
		sb.append("\n\n");

		// text after applet
		text = textBelow.getText();
		if (text != null) {
			sb.append("<p>\n");
			sb.append(Util.toHTMLString(text));
			sb.append("</p>\n");
		}

		// footer
		// author and date information for footer
		String author = cons.getAuthor();
		String date = cons.getDate();
		String line = null;
		if (!author.equals("")) {
			line = author;
		}
		if (!date.equals("")) {
			if (line == null)
				line = date;
			else
				line = line + ", " + date;
		}

		sb.append("<p>");
		sb.append("<span style=\"font-size:small\">");
		if (line != null) {
			sb.append(Util.toHTMLString(line));
			sb.append(", ");
		}
		sb.append(guiManager.getCreatedWithHTML());
		sb.append("</span>");
		sb.append("</p>");

		sb.append("</td></tr>\n");
		sb.append("</table>");
		sb.append("</body>\n");
		sb.append("</html>");

		return sb.toString();
	}
	
	private String getAppletTag(File ggbFile, int width, int height) {
		StringBuffer sb = new StringBuffer();
		// include applet
		sb.append("<applet name=\"ggbApplet\" code=\"geogebra.GeoGebraApplet\"");
		// archive geogebra.jar 
		sb.append(" archive=\"geogebra.jar\"");
		
		
		if (cbOfflineArchiveAndGgbFile.isSelected()) {
			// codebase for offline applet
			sb.append("\n\tcodebase=\"./\"");
		} else {
			// add codebase for online applets
			sb.append("\n\tcodebase=\"");
			sb.append(GeoGebra.GEOGEBRA_ONLINE_ARCHIVE_BASE);
			if (!cbSavePrint.isSelected() && !cbOfflineArchiveAndGgbFile.isSelected())
				sb.append("unsigned/");
			sb.append("\"");
		}
		
		// width, height
		sb.append("\n\twidth=\"");
		sb.append(width);
		sb.append("\" height=\"");
		sb.append(height);
		// add MAYSCRIPT to ensure ggbOnInit() can be called
		sb.append("\" MAYSCRIPT>\n");

		if (cbOfflineArchiveAndGgbFile.isSelected()) {
			// ggb file
			sb.append("\t<param name=\"filename\" value=\"");
			sb.append(ggbFile.getName());
			sb.append("\"/>\n");		
		} else {
			// base64 encoding
			sb.append("\t<param name=\"ggbBase64\" value=\"");
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			try {
				app.getXMLio().writeGeoGebraFile(baos, false);
				sb.append(geogebra.util.Base64.encode(baos.toByteArray(), 0));
			} catch (IOException e) {
				e.printStackTrace();
			}
			sb.append("\"/>\n");
		}
		
		// loading image for online applet
		if (!cbOfflineArchiveAndGgbFile.isSelected()) {
			sb.append("\t<param name=\"image\" value=\""+ GeoGebra.LOADING_GIF + "\"  />\n");
			sb.append("\t<param name=\"boxborder\" value=\"false\"  />\n");
			sb.append("\t<param name=\"centerimage\" value=\"true\"  />\n");
		}

		if (useWorksheet) {
			appendAllAppletParameters(sb, TYPE_HTMLFILE);			
		} else {// button type
			sb.append("\t<param name=\"type\" value=\"button\"  />\n");
			// white background
			sb.append("\t<param name=\"bgcolor\" value=\"#FFFFFF\"  />\n");
		}

		sb.append("Sorry, the GeoGebra Applet could not be started. Please make sure that ");
		sb.append("Java 1.4.2 (or later) is installed and active in your browser ");
		sb.append("(<a href=\"http://java.sun.com/getjava\">Click here to install Java now</a>)\n");
		sb.append("</applet>");
		return sb.toString();
	}
	
	private void appletParam(StringBuffer sb, String param, boolean value, int type) {
		appletParam(sb, param, value+"", type);
	
	}
	private void appletParam(StringBuffer sb, String param, String value, int type) {
		
		switch (type) {
		case TYPE_MEDIAWIKI:
			sb.append(' ');
			sb.append(param);
			sb.append(" = \"");
			sb.append(value);
			sb.append('\"');
			break;
			
		case TYPE_GOOGLEGADGET:
			sb.append(param);
			sb.append(":\"");
			sb.append(value);
			sb.append("\", ");
			
			break;
			
		default: // HTML file/clipboard
			sb.append("\t<param name=\"");
			sb.append(param);
			sb.append("\" value=\"");
			sb.append(value);
			sb.append("\" />\n");
		}
		
	}
	
	private void appendGgbAppletParameters(StringBuffer sb, int type) {
		
		// framePossible (double click opens GeoGebra window)
		appletParam(sb, "framePossible", cbShowFrame.isSelected(), type);
		
		// showResetIcon
		appletParam(sb, "showResetIcon", cbShowResetIcon.isSelected(), type);
		
		// TODO: implement show animation controls
		appletParam(sb, "showAnimationButton", true, type);
		
		// enable right click
		appletParam(sb, "enableRightClick", cbEnableRightClick.isSelected(), type);
		
		// enable error dialogs
		appletParam(sb, "errorDialogsActive", true, type);// sb.append(cbEnableErrorDialogs.isSelected());
		
		// enable label drags
		appletParam(sb, "enableLabelDrags", cbEnableLabelDrags.isSelected(), type);
		
		// showMenuBar
		appletParam(sb, "showMenuBar", cbShowMenuBar.isSelected(), type);
		
		// showToolBar
		appletParam(sb, "showToolBar", cbShowToolBar.isSelected(), type);
		
		// showToolBarHelp
		appletParam(sb, "showToolBarHelp", cbShowToolBarHelp.isSelected(), type);
		
		// showAlgebraInput
		appletParam(sb, "showAlgebraInput", cbShowInputField.isSelected(), type);
		
	}
	
	StringBuffer sb2 = new StringBuffer();
	
	/**
	 * Appends all selected applet parameters
	 */
	private void appendAllAppletParameters(StringBuffer sb, int type) {
		
		
		// JVM arguments, for Java 1.6.0_10 and later
		// increase heap memory for applets
		String javaArgs = "-Xmx" + GeoGebra.MAX_HEAP_SPACE + "m";
		// TODO: include pack.gz files in offline export
//		if (cbOfflineArchive.isSelected()) {
//			// look for local pack200 files: jar.pack.gz
//			javaArgs += " -Djnlp.packEnabled=true";
//		}

		//sb.append("\t<param name=\"java_arguments\" value=\"" + javaArgs + "\" />\n");		
		appletParam(sb, "java_arguments", javaArgs, type);
		
		// add caching information to help JVM with faster applet loading
		//sb.append("\t<param name=\"cache_archive\" value=\"");
		sb2.setLength(0);
		for (int i=0; i < Application.JAR_FILES.length; i++) {
			sb2.append(Application.JAR_FILES[i]);
			if (i < Application.JAR_FILES.length-1) sb2.append(", ");
		}
		//sb.append("\" />\n");
		
		appletParam(sb, "cache_archive", sb2.toString(), type);

		
		// cache versions of jar files: if this version is already present on the client
		// then the JVM does not need to connect to the server to compare jar time stamps
		//sb.append("\t<param name=\"cache_version\" value=\"");
		sb2.setLength(0);
		for (int i=0; i < Application.JAR_FILES.length; i++) {
			sb2.append(GeoGebra.VERSION_STRING);
			if (i < Application.JAR_FILES.length-1) sb2.append(", ");
		}
		//sb.append("\" />\n");
		appletParam(sb, "cache_version", sb2.toString(), type);
		
		appendGgbAppletParameters(sb, type);
		
	}

}
