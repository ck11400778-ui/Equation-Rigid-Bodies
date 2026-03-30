Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
projectPath = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = projectPath
shell.Run "cmd /c """ & projectPath & "\Open Equation Rigid Bodies Web.cmd""", 0, False
