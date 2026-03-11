/* 
GeoGebra - Dynamic Mathematics for Everyone
http://www.geogebra.org

This file is part of GeoGebra.

This program is free software; you can redistribute it and/or modify it 
under the terms of the GNU General Public License as published by 
the Free Software Foundation.

*/

package geogebra.kernel;

import geogebra.euclidian.EuclidianView;
import geogebra.main.Application;

import java.awt.Color;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Set;

/**
 * Manages default settings for GeoElement objects in a construction.
 * @author Markus Hohenwarter
 */
public class ConstructionDefaults {
	
	// DEFAULT GeoElement types
	// PLEASE DON'T USE RANGE 3000-3999 (used by GeoGebra3D)
	public static final int DEFAULT_POINT_FREE = 10;
	public static final int DEFAULT_POINT_DEPENDENT = 11;
	public static final int DEFAULT_POINT_ON_PATH = 12;
	public static final int DEFAULT_POINT_IN_REGION = 13;
	public static final int DEFAULT_POINT_COMPLEX =  14;
	
	public static final int DEFAULT_LINE = 20;			
	public static final int DEFAULT_VECTOR = 30;	
	public static final int DEFAULT_CONIC = 40;
	public static final int DEFAULT_CONIC_SECTOR = 41;
		
	public static final int DEFAULT_NUMBER = 50;	
	public static final int DEFAULT_ANGLE = 52;			
	
	public static final int DEFAULT_FUNCTION = 60;		
	public static final int DEFAULT_POLYGON = 70;
	public static final int DEFAULT_LOCUS = 80;
	
	public static final int DEFAULT_TEXT = 100;
	public static final int DEFAULT_IMAGE = 110;
	public static final int DEFAULT_BOOLEAN = 120;
	
	public static final int DEFAULT_LIST = 130;
		
	// DEFAULT COLORs
	// points
	public static final Color colPoint = Color.blue;
	public static final Color colDepPoint = Color.darkGray;
	public static final Color colPathPoint = new Color(125, 125, 255);
	public static final Color colRegionPoint = colPathPoint;
	public static final Color colComplexPoint = colPoint;
	
	// lines
	private static final Color colLine = Color.black;

	// conics
	private static final Color colConic = Color.black;

	// polygons
	protected static final Color colPolygon = new Color(153, 51, 0);	
	public static final float DEFAULT_POLYGON_ALPHA = 0.1f;

	// angles
	private static final Color colAngle = new Color(0, 100, 0);
	public static final float DEFAULT_ANGLE_ALPHA = 0.1f;

	// locus lines	
	private static final Color colLocus = Color.black;
	
	// functions
	private static final Color colFunction = Color.black;
	
	// lists
	private static final Color colList = new Color(0, 110, 0);

	// numbers (slope, definite integral)
	private static final Color colNumber = Color.black;	
	
	// preview colors
	public static final Color colPreview = Color.darkGray;

	public static final Color colPreviewFill = new Color(
			colPolygon.getRed(), 
			colPolygon.getGreen(), 
			colPolygon.getBlue(), 
			(int) (DEFAULT_POLYGON_ALPHA * 255));	
	
	// label visibility
	public static final int LABEL_VISIBLE_AUTOMATIC = 0;	
	public static final int LABEL_VISIBLE_ALWAYS_ON = 1;
	public static final int LABEL_VISIBLE_ALWAYS_OFF = 2;
	public static final int LABEL_VISIBLE_POINTS_ONLY = 3;
	public static final int LABEL_VISIBLE_USE_DEFAULTS = 4;
		
	// construction
	protected Construction cons;
	
	// defaultGeoElement list
	protected HashMap defaultGeoElements;		
	
	private int lineThickness = EuclidianView.DEFAULT_LINE_THICKNESS;
	private int pointSize = EuclidianView.DEFAULT_POINT_SIZE;
	private int angleSize = EuclidianView.DEFAULT_ANGLE_SIZE;
	private float filling = DEFAULT_POLYGON_ALPHA;
	
	private boolean blackWhiteMode = false;
	
	/**
	 * Creates a new ConstructionDefaults object to manage the
	 * default objects of this construction.
	 * @param cons
	 */
	public ConstructionDefaults(Construction cons) {
		this.cons = cons;
		createDefaultGeoElements();		
	}

	
	/**
	 * Returns a set of all default GeoElements used by this construction.
	 */
	public Set getDefaultGeos() {
		return defaultGeoElements.entrySet();
	}
	
	protected String strFree = " (free)";
	protected String strDependent = " (dependent)";
	
	protected void createDefaultGeoElements() {
		defaultGeoElements = new HashMap();		
		
		Application app = cons.getApplication();		
//		String strFree = " (" + app.getPlain("free") + ")";
//		String strDependent = " (" + app.getPlain("dependent") + ")";
		//String strFree = " (free)";
		//String strDependent = " (dependent)";
						
		// free point
		GeoPoint freePoint = new GeoPoint(cons);	
//		freePoint.setLocalVariableLabel(app.getPlain("Point") + strFree);
		freePoint.setPointSize(EuclidianView.DEFAULT_POINT_SIZE);
		freePoint.setPointStyle(EuclidianView.POINT_STYLE_DOT);
		freePoint.setLocalVariableLabel("Point" + strFree);
		freePoint.setObjColor(colPoint);
		freePoint.setPointSize(pointSize);
		defaultGeoElements.put(DEFAULT_POINT_FREE, freePoint);
		
		// dependent point
		GeoPoint depPoint = new GeoPoint(cons);	
//		depPoint.setLocalVariableLabel(app.getPlain("Point") + strDependent);
		depPoint.setPointSize(EuclidianView.DEFAULT_POINT_SIZE);
		depPoint.setPointStyle(EuclidianView.POINT_STYLE_DOT);
		depPoint.setLocalVariableLabel("Point" + strDependent);
		depPoint.setObjColor(colDepPoint);
		depPoint.setPointSize(pointSize);
		defaultGeoElements.put(DEFAULT_POINT_DEPENDENT, depPoint);
		
		// point on path
		GeoPoint pathPoint = new GeoPoint(cons);	
//		pathPoint.setLocalVariableLabel(app.getPlain("PointOn"));
		pathPoint.setPointSize(EuclidianView.DEFAULT_POINT_SIZE);
		pathPoint.setPointStyle(EuclidianView.POINT_STYLE_DOT);
		pathPoint.setLocalVariableLabel("PointOn");
		pathPoint.setObjColor(colPathPoint);
		pathPoint.setPointSize(pointSize);
		defaultGeoElements.put(DEFAULT_POINT_ON_PATH, pathPoint);
		
		// point in region
		GeoPoint regionPoint = new GeoPoint(cons);	
//		regionPoint.setLocalVariableLabel(app.getPlain("PointOn"));
		regionPoint.setPointSize(EuclidianView.DEFAULT_POINT_SIZE);
		regionPoint.setPointStyle(EuclidianView.POINT_STYLE_DOT);
		regionPoint.setLocalVariableLabel("PointInRegion");
		regionPoint.setObjColor(colRegionPoint);
		defaultGeoElements.put(DEFAULT_POINT_IN_REGION, regionPoint);
		
		// complex number (handled like a point)
		GeoPoint complexPoint = new GeoPoint(cons);
		complexPoint.setPointSize(EuclidianView.DEFAULT_POINT_SIZE);
		complexPoint.setPointStyle(EuclidianView.POINT_STYLE_DOT);
		complexPoint.setLocalVariableLabel("PointOn");
		complexPoint.setObjColor(colComplexPoint);
		complexPoint.setPointSize(pointSize);
		defaultGeoElements.put(DEFAULT_POINT_COMPLEX, complexPoint);
		
		// line
		GeoLine line = new GeoLine(cons);	
//		line.setLocalVariableLabel(app.getPlain("Line"));
		line.setLocalVariableLabel("Line");
		line.setObjColor(colLine);
		defaultGeoElements.put(DEFAULT_LINE, line);
		
		// vector
		GeoVector vector = new GeoVector(cons);
		vector.setLocalVariableLabel("Vector");
		vector.setObjColor(colLine);
		defaultGeoElements.put(DEFAULT_VECTOR, vector);
		
		// polygon
		GeoPolygon polygon = new GeoPolygon(cons, null);	
//		polygon.setLocalVariableLabel(app.getPlain("Polygon"));
		polygon.setLocalVariableLabel("Polygon");
		polygon.setObjColor(colPolygon);
		polygon.setAlphaValue(DEFAULT_POLYGON_ALPHA);
		defaultGeoElements.put(DEFAULT_POLYGON, polygon);
										
		// conic
		GeoConic conic = new GeoConic(cons);	
//		conic.setLocalVariableLabel(app.getPlain("Conic"));
		conic.setLocalVariableLabel("Conic");
		conic.setObjColor(colConic);
		defaultGeoElements.put(DEFAULT_CONIC, conic);	
		
		// conic sector
		GeoConicPart conicSector = new GeoConicPart(cons, GeoConicPart.CONIC_PART_SECTOR);	
//		conicSector.setLocalVariableLabel(app.getPlain("Sector"));
		conicSector.setLocalVariableLabel("Sector");
		conicSector.setObjColor(colPolygon);
		conicSector.setAlphaValue(DEFAULT_POLYGON_ALPHA);
		defaultGeoElements.put(DEFAULT_CONIC_SECTOR, conicSector);	
		
		
		// number
		GeoNumeric number = new GeoNumeric(cons);	
//		number.setLocalVariableLabel(app.getPlain("Numeric"));
		number.setLocalVariableLabel("Numeric");
		number.setObjColor(colNumber);
		number.setLabelMode(GeoElement.LABEL_NAME_VALUE);	
		defaultGeoElements.put(DEFAULT_NUMBER, number);
				
		// angle
		GeoAngle angle = new GeoAngle(cons);	
//		angle.setLocalVariableLabel(app.getPlain("Angle"));
		angle.setLocalVariableLabel("Angle");
		angle.setObjColor(colAngle);		
		angle.setAlphaValue(DEFAULT_ANGLE_ALPHA);
		angle.setArcSize(angleSize);
		//angle.setDrawable(true);
		//angle.setParentAlgorithm(new AlgoElement(cons));
		defaultGeoElements.put(DEFAULT_ANGLE, angle);
		
		// function
		GeoFunction function = new GeoFunction(cons);	
//		function.setLocalVariableLabel(app.getPlain("Function"));
		function.setLocalVariableLabel("Function");
		function.setObjColor(colFunction);
		defaultGeoElements.put(DEFAULT_FUNCTION, function);
		
		// locus
		GeoLocus locus = new GeoLocus(cons);	
//		locus.setLocalVariableLabel(app.getPlain("Locus"));
		locus.setLocalVariableLabel("Locus");
		locus.setObjColor(colLocus);		
		locus.setLabelVisible(false);
		defaultGeoElements.put(DEFAULT_LOCUS, locus);					
		
		// text
		GeoText text = new GeoText(cons);		
//		text.setLocalVariableLabel(app.getPlain("Text"));
		text.setLocalVariableLabel("Text");
		defaultGeoElements.put(DEFAULT_TEXT, text);	
		
		// image
		GeoImage img = new GeoImage(cons);
//		img.setLocalVariableLabel(app.getPlain("Image"));
		img.setLocalVariableLabel("Image");
		defaultGeoElements.put(DEFAULT_IMAGE, img);	
		
		// boolean
		GeoBoolean bool = new GeoBoolean(cons);		
//		bool.setLocalVariableLabel(app.getPlain("Boolean"));
		bool.setLocalVariableLabel("Boolean");
		defaultGeoElements.put(DEFAULT_BOOLEAN, bool);
		
		// list
		GeoList list = new GeoList(cons);	
//		list.setLocalVariableLabel(app.getPlain("List"));
		list.setShowAllProperties(true); // show all properties in the defaults dialog
		list.setLocalVariableLabel("List");
		list.setObjColor(colList);
		list.setAlphaValue(-1); // wait until we have an element in the list
								// then we will use the alphaValue of the first element in the list
								// see GeoList.setAlphaValue() and getAlphaValue()
		defaultGeoElements.put(DEFAULT_LIST, list);
	}
	
	/**
	 * Returns a default GeoElement of this construction.
	 * @param type: use DEFAULT_* constants (e.g. DEFAULT_POINT_FREE) 
	 */
	public GeoElement getDefaultGeo(int type) {
		return (GeoElement) defaultGeoElements.get(type);		
	}
	
	
	
	
	/**
	 * return the default type of the GeoElement
	 * @param geo a GeoElement
	 * @return the default type
	 */
	public int getDefaultType(GeoElement geo){

		// all object types that are not specifically supported
		// should get the default values of a line
		int type = DEFAULT_LINE;

		switch (geo.getGeoClassType()) {
		case GeoElement.GEO_CLASS_POINT:
			GeoPoint p = (GeoPoint) geo;
			
			if(p.getMode() == Kernel.COORD_COMPLEX) {
				type = DEFAULT_POINT_COMPLEX;
			} else if (p.isIndependent()) {
				type = DEFAULT_POINT_FREE;
			} else {
				if (p.hasPath())
					type = DEFAULT_POINT_ON_PATH;	
				else if (p.hasRegion())
					type = DEFAULT_POINT_IN_REGION;					
				else
					type = DEFAULT_POINT_DEPENDENT;
			}
			break;

		case GeoElement.GEO_CLASS_ANGLE:
			type = DEFAULT_ANGLE;	
			break;

		case GeoElement.GEO_CLASS_BOOLEAN:
			type = DEFAULT_BOOLEAN;
			break;	

		case GeoElement.GEO_CLASS_CONIC:			
			type = DEFAULT_CONIC;
			break;

		case GeoElement.GEO_CLASS_CONICPART:
			GeoConicPart conicPart = (GeoConicPart) geo;
			if (conicPart.getConicPartType() == GeoConicPart.CONIC_PART_SECTOR) {
				type = DEFAULT_CONIC_SECTOR;
			} else {
				type = DEFAULT_CONIC;
			}
			break;

		case GeoElement.GEO_CLASS_FUNCTION:
		case GeoElement.GEO_CLASS_FUNCTIONCONDITIONAL:
			type = DEFAULT_FUNCTION;
			break;

		case GeoElement.GEO_CLASS_IMAGE:
			type = DEFAULT_IMAGE;
			break;

		case GeoElement.GEO_CLASS_LIST:
			type = DEFAULT_LIST;
			break;	

		case GeoElement.GEO_CLASS_LOCUS:
			type = DEFAULT_LOCUS;
			break;

		case GeoElement.GEO_CLASS_NUMERIC:
			type = DEFAULT_NUMBER;
			break;

		case GeoElement.GEO_CLASS_POLYGON: 
			type = DEFAULT_POLYGON;
			break;

		case GeoElement.GEO_CLASS_TEXT:
			type = DEFAULT_TEXT;
			break;

		case GeoElement.GEO_CLASS_VECTOR:
			type = DEFAULT_VECTOR;
			break;	


		}		
		
		return type;

	}
	
	
	
	/**
	 * Sets default color for given geo. 
	 * Note: this is mostly kept for downward compatibility.
	 * 
	 * @param geo The element which needs new default visual styles
	 * @param isReset If the visual styles should be reset
	 */
	final public void setDefaultVisualStyles(GeoElement geo, boolean isReset) {
		// all object types that are not specifically supported
		// should get the default values of a line
		//int type = DEFAULT_LINE;
		int type = getDefaultType(geo);
			
		
		// default
		GeoElement defaultGeo = getDefaultGeo(type);
		Application app = cons.getApplication();
		
		if (defaultGeo != null) {
			geo.setAllVisualProperties(defaultGeo, isReset);		
			
			if(!isReset) {
				// set to highest used layer
				if (app != null) {
					EuclidianView ev = app.getEuclidianView();
					if (ev != null)
						geo.setLayer(ev.getMaxLayerUsed());
				}
			}
		}

        // label visibility
		int labelingStyle = app == null ? LABEL_VISIBLE_USE_DEFAULTS : 
										app.getLabelingStyle();
		
		// automatic labelling: 
		// if algebra window open -> all labels
		// else -> no labels
		if (labelingStyle == LABEL_VISIBLE_AUTOMATIC) {
			if(app.hasGuiManager()) {
				labelingStyle = LABEL_VISIBLE_USE_DEFAULTS;
				/* TODO method chains doesn't allow app.getGuiManager().showAlgebraView() to appear here, fix this (F.S.)
				labelingStyle = app.getGuiManager().showAlgebraView() ?
										LABEL_VISIBLE_USE_DEFAULTS :
										LABEL_VISIBLE_ALWAYS_OFF;*/
			} else {
				labelingStyle = LABEL_VISIBLE_USE_DEFAULTS;
			}
		}
		
		switch (labelingStyle) {									
			case LABEL_VISIBLE_ALWAYS_ON:
				geo.setLabelVisible(true);
				break;
			
			case LABEL_VISIBLE_ALWAYS_OFF:
				geo.setLabelVisible(false);
				break;
				
			case LABEL_VISIBLE_POINTS_ONLY:
				geo.setLabelVisible(geo.isGeoPoint());
				break;			
				
			default:
			case LABEL_VISIBLE_USE_DEFAULTS:
				// don't change anything
				break;														
		}			
		
		if (blackWhiteMode) {
			// use black color and no filling
			geo.setObjColor(Color.black);
			geo.setAlphaValue(0f);
		}
		
		/*
		void initSetLabelVisible() {
			labelVisible =  ! isPath() || app.showAlgebraView();
		}*/
	}
	
	public void setBlackWhiteMode(boolean flag) {
		blackWhiteMode = flag;
	}
	
	public boolean getBlackWhiteMode() {
		return blackWhiteMode;
	}
	
	public int getLineThicknessDefault() {
		return lineThickness;
	}
	
	public int getAngleSizeDefault() {
		return angleSize;
	}
	
	public int getPointSizeDefault() {
		return pointSize;
	}
	
	public float getAlphaDefault() {
		return filling;
	}
	
	public void resetDefaults() {
		lineThickness = EuclidianView.DEFAULT_LINE_THICKNESS;
		pointSize = EuclidianView.DEFAULT_POINT_SIZE;
		angleSize = EuclidianView.DEFAULT_ANGLE_SIZE;
		filling = DEFAULT_POLYGON_ALPHA;
		
		setDefaultLineThickness(lineThickness);
		setDefaultPointSize(pointSize);
		setDefaultAngleSize(angleSize);
		setDefaultFilling(filling);

	}
	
	public void setDefaultAngleSize(int angleSize) {
		
		this.angleSize = Math.max(angleSize, 1);
			
		Iterator it = defaultGeoElements.values().iterator();
		while (it.hasNext()) {
			GeoElement geo = (GeoElement) it.next();	
			
					
			switch (geo.getGeoClassType()) {
			
				case GeoElement.GEO_CLASS_ANGLE:					
					((GeoAngle) geo).setArcSize(angleSize);
					break;				
			}
		}		
	}
	
	public void setDefaultPointSize(int pointSize) {
			
		this.pointSize = Math.max(pointSize, 1);
		
		Iterator it = defaultGeoElements.values().iterator();
		while (it.hasNext()) {
			GeoElement geo = (GeoElement) it.next();	
			
				
			switch (geo.getGeoClassType()) {
			case GeoElement.GEO_CLASS_POINT:
				((GeoPoint) geo).setPointSize(pointSize); 
				break;
				
			case GeoElement.GEO_CLASS_LIST:
				((GeoList) geo).setPointSize(pointSize); 
				break;
				
			}
		}		
	}
	
	public void setDefaultLineThickness(int lineThickness) {
		
		this.lineThickness = Math.max(lineThickness, 1);
			
		Iterator it = defaultGeoElements.values().iterator();
		while (it.hasNext()) {
			GeoElement geo = (GeoElement) it.next();	
			
			// set line thickness
			if (!geo.isGeoText() && !geo.isGeoImage()) // affects bounding box
				geo.setLineThickness(lineThickness);
					
			switch (geo.getGeoClassType()) {
				
			case GeoElement.GEO_CLASS_LIST:
				((GeoList) geo).setLineThickness(lineThickness); 
				break;
			}
		}		
	}
	public void setDefaultFilling(float filling) {
		
		this.filling = filling;
			
		Iterator it = defaultGeoElements.values().iterator();
		while (it.hasNext()) {
			GeoElement geo = (GeoElement) it.next();	
			
			geo.setAlphaValue(filling);
		}		
	}

}