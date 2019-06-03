::--------------------------------------------------------------------
:: create release package for Chrome extension
::--------------------------------------------------------------------
@echo off
setlocal ENABLEDELAYEDEXPANSION
setlocal 

set PACKAGE_NAME="Student infoDeck"
set PACKAGE_RELEASEFILE_PREFIX=sid_release_
set PACKAGE_VERSION=
set PACKAGE_RELEASEFILE=

echo *******************************************************
echo * building release package for %PACKAGE_NAME%
echo *******************************************************
echo.

:: initialize log file with time and date
for /F "tokens=2" %%i in ('date /t') do set mydate=%%i
set mytime=%time%
echo time is %mydate% %mytime% > makerelease.log

:: get version string for package from manifest.json
FOR /F "tokens=1,2 delims=:" %%i IN ('find "version" manifest.json') DO (
  set MYTEMPKEY=
  set MYTEMPKEY=%%i
  set MYTEMPKEY=!MYTEMPKEY:~2!
  if [!MYTEMPKEY!] == ["version"] (
    set MYTEMPVAL=%%j
    set PACKAGE_VERSION=!MYTEMPVAL:~2,-2!
  )
)
set MYTEMPKEY=
set MYTEMPVAL=
::echo final version [%PACKAGE_VERSION%]

if not defined PACKAGE_VERSION (
  echo failed to parse version from manifest.json
  echo failed to parse version from manifest.json >> makerelease.log 2>&1
  goto abort
)

:: fail if release package already exists
set PACKAGE_RELEASEFILE=%PACKAGE_RELEASEFILE_PREFIX%%PACKAGE_VERSION%.zip
if not EXIST %PACKAGE_RELEASEFILE% goto continue01
echo %PACKAGE_RELEASEFILE% already exists
echo %PACKAGE_RELEASEFILE% already exists >> makerelease.log 2>&1
goto abort

:continue01
echo remove staging directories...
rmdir release_staging /S /Q  >> makerelease.log 2>&1

echo creating staging directories...
mkdir release_staging  >> makerelease.log 2>&1
mkdir release_staging\styles  >> makerelease.log 2>&1
mkdir release_staging\scripts  >> makerelease.log 2>&1
mkdir release_staging\images  >> makerelease.log 2>&1

echo copying files to staging...
xcopy popup.html release_staging  >> makerelease.log 2>&1
xcopy manifest.json release_staging  >> makerelease.log 2>&1
xcopy LICENSE release_staging  >> makerelease.log 2>&1
xcopy *.png release_staging  >> makerelease.log 2>&1
xcopy styles\*.* release_staging\styles  >> makerelease.log 2>&1
xcopy scripts\*.* release_staging\scripts  >> makerelease.log 2>&1
xcopy images\*.* release_staging\images  >> makerelease.log 2>&1

echo creating ZIP for release...
cd release_staging  >> makerelease.log 2>&1
"C:\Program Files\7-zip\7z.exe" a -r ..\%PACKAGE_RELEASEFILE% *  >> ../makerelease.log 2>&1
cd ..  >> ../makerelease.log 2>&1


echo.
echo release package for %PACKAGE_NAME% is complete
echo release package for %PACKAGE_NAME% is complete >> makerelease.log 2>&1
echo release file name: %PACKAGE_RELEASEFILE%
echo release file name: %PACKAGE_RELEASEFILE% >> makerelease.log 2>&1
echo.
pause
goto the_end

:abort
echo.
echo *** release package build aborted ***
echo *** release package build aborted *** >> makerelease.log 2>&1
echo.
pause
goto the_end

:the_end
set PACKAGE_NAME=
set PACKAGE_RELEASEFILE_PREFIX=
set PACKAGE_VERSION=
set PACKAGE_RELEASEFILE=
exit /B
