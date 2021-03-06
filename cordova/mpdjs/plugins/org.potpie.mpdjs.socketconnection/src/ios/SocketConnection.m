/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Richard Backhouse
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

#import "SocketConnection.h"

@implementation SocketConnection

- (void)pluginInitialize {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onPause) name:UIApplicationDidEnterBackgroundNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onResume) name:UIApplicationWillEnterForegroundNotification object:nil];
}

- (void)connect:(CDVInvokedUrlCommand*)command {
    self.connectCommand = command;
    self.host = [command.arguments objectAtIndex:0];
    NSString* strPort = [command.arguments objectAtIndex:1];
    self.port = [strPort intValue];
    self.internalConnect = false;
    [self mpdConnect];
}

- (void)disconnect:(CDVInvokedUrlCommand *)command {
    [self mpdDisconnect];
    self.host = nil;
    self.port = 0;
}

- (void)writeMessage:(CDVInvokedUrlCommand *)command {
    NSString* message = [command.arguments objectAtIndex:0];
    NSData *data = [[NSData alloc] initWithData:[message dataUsingEncoding:NSUTF8StringEncoding]];
    [self.outputStream write:[data bytes] maxLength:[data length]];
    
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"written"];
    [pluginResult setKeepCallbackAsBool:true];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void)listen:(CDVInvokedUrlCommand*)command {
    self.listenerCommand = command;
}

- (void)setActiveListener:(CDVInvokedUrlCommand*)command {
    self.activeCommand = command;
}


- (void)stream:(NSStream *)stream handleEvent:(NSStreamEvent)streamEvent {
    switch (streamEvent) {
        case NSStreamEventOpenCompleted: {
            if (stream == self.inputStream) {
                NSString* statusMsg = nil;
                if (self.internalConnect == false) {
                    statusMsg = @"connected";
                } else {
                    statusMsg = @"internalConnected";
                    self.internalConnect = false;
                }
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:statusMsg];
                [pluginResult setKeepCallbackAsBool:true];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            }
            break;
        }
            
        case NSStreamEventHasBytesAvailable:
            if (stream == self.inputStream) {
                uint8_t buffer[1024];
                long len;
                
                while ([self.inputStream hasBytesAvailable]) {
                    len = [self.inputStream read:buffer maxLength:sizeof(buffer)];
                    if (len > 0) {
                        
                        NSString *output = [[NSString alloc] initWithBytes:buffer length:len encoding:NSUTF8StringEncoding];
                        
                        if (output != nil) {
                            CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:output];
                            [pluginResult setKeepCallbackAsBool:true];
                            [self.commandDelegate sendPluginResult:pluginResult callbackId:self.listenerCommand.callbackId];
                        }
                    }
                }
            }
            break;
            
            
        case NSStreamEventErrorOccurred: {
            if (stream == self.inputStream) {
                NSError *theError = [stream streamError];
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[theError localizedDescription]];
                [pluginResult setKeepCallbackAsBool:true];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            }
            break;
        }
            
        case NSStreamEventEndEncountered: {
            [stream close];
            [stream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
            stream = nil;
            
            if (stream == self.inputStream) {
                CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"disconnected"];
                [pluginResult setKeepCallbackAsBool:true];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.connectCommand.callbackId];
            }
            break;
        }
            
        default:
            break;
    }
}

- (void) onPause {
    if (self.activeCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"paused"];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.activeCommand.callbackId];
    }
    if (self.host != nil) {
        [self mpdDisconnect];
    }
}

- (void) onResume {
    if (self.host != nil) {
        [NSThread sleepForTimeInterval:1.0f];
        self.internalConnect = true;
        [self mpdConnect];
    }
    if (self.activeCommand != nil) {
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"resumed"];
        [pluginResult setKeepCallbackAsBool:true];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.activeCommand.callbackId];
    }
}

- (void) mpdConnect {
    CFReadStreamRef readStream;
    CFWriteStreamRef writeStream;
    CFStreamCreatePairWithSocketToHost(NULL, (__bridge CFStringRef)self.host, self.port, &readStream, &writeStream);
    self.inputStream = (__bridge NSInputStream *)readStream;
    self.outputStream = (__bridge NSOutputStream *)writeStream;
    
    [self.inputStream setDelegate:self];
    [self.outputStream setDelegate:self];
    [self.inputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [self.outputStream scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [self.inputStream open];
    [self.outputStream open];

}

- (void) mpdDisconnect {
    [self.inputStream close];
    [self.inputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    self.inputStream = nil;
    
    [self.outputStream close];
    [self.outputStream removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    self.outputStream = nil;
}

@end