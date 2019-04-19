#/usr/bin/env python
from LaunchServices import LSSetDefaultHandlerForURLScheme
from LaunchServices import LSSetDefaultRoleHandlerForContentType
from LaunchServices import UTTypeCreatePreferredIdentifierForTag
from LaunchServices import kUTTagClassFilenameExtension
from LaunchServices import kLSRolesViewer # 0x00000002

SPLAYER = 'org.splayer.splayerx'

# https://developer.apple.com/library/archive/documentation/Miscellaneous/Reference/UTIRef/Articles/System-DeclaredUniformTypeIdentifiers.html#//apple_ref/doc/uid/TP40009259-SW1
LSSetDefaultRoleHandlerForContentType('public.movie', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.video', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.avi', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.mpeg', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.mpeg-4', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.3gpp', kLSRolesViewer, SPLAYER)
LSSetDefaultRoleHandlerForContentType('public.3gpp2', kLSRolesViewer, SPLAYER)
# Create UTI for extra extensions
for ext in [$EXTS]:
    UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, ext, None)
    LSSetDefaultRoleHandlerForContentType(UTI, kLSRolesViewer, SPLAYER)


# LSSetDefaultHandlerForURLScheme('http', SPLAYER)
# LSSetDefaultHandlerForURLScheme('https', SPLAYER)