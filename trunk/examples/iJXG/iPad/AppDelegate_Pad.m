#import "AppDelegate_Pad.h"

@implementation AppDelegate_Pad

@synthesize window;

@synthesize webView;		// Synthesize webView

#define WWW_ROOT	@"www"	// Define the root of the Web folder

- (BOOL)application:(UIApplication *)application
didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {    
	
	// Add code to open bundled Web site
	
	NSString *path = [[NSBundle mainBundle]
					  pathForResource:@"index"
					  ofType:@"html"
					  inDirectory:WWW_ROOT ]; 
	
	NSURL *url = [NSURL fileURLWithPath:path];
	
	NSURLRequest *request = [NSURLRequest requestWithURL:url];
	
	[webView loadRequest:request];
	
    // Override point for customization after application launch
	
    [window makeKeyAndVisible];
	
	return YES;
}