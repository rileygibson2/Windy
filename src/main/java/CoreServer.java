package main.java;

import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.server.handler.ResourceHandler;
import org.eclipse.jetty.servlet.ServletHandler;


public class CoreServer {
	public static AccountManager accountManager;
	
	public static void main(String[] args) throws Exception {
		Server server = new Server(80);
		String webappPath = System.getProperty("user.dir")+"/src/main/webapp";
		System.out.println(webappPath);
		accountManager = new AccountManager();

		ResourceHandler resourceHandler = new ResourceHandler();
		resourceHandler.setResourceBase(webappPath);
		//resourceHandler.setDirAllowed(true);
		//resourceHandler.setPathInfoOnly(false);
		ServletHandler dataHandler = new ServletHandler();
		server.setHandler(dataHandler);
		dataHandler.addServletWithMapping(WebServlet.class, "/data/*");
       
        HandlerList handlers = new HandlerList();
        handlers.setHandlers(new Handler[] { resourceHandler, dataHandler});
        server.setHandler(handlers);

		server.start();
		System.out.println("Server running!");
		server.join();
	}
}
