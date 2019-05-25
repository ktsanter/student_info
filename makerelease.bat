::--------------------------------------------------------------------
:: create release package for Student infoDeck Chrome extension
::--------------------------------------------------------------------
@echo off
setlocal ENABLEDELAYEDEXPANSION

echo *******************************************************
echo * building release package for Student infoDeck
echo *******************************************************

echo.
set PACKAGE_VERSION=
set PACKAGE_RELEASEFILE=

:: get version string for package from manifest.json
FOR /F "tokens=1,2 delims=:" %%i IN ('find "version" manifest.json') DO (
  set MYTEMPVAR=
  call makerelease_support01 %%i
  if [!MYTEMPVAR!] == ["version"] (
    set MYTEMPVAR=
    call makerelease_support01 %%j
    set PACKAGE_VERSION=!MYTEMPVAR:~1,-1!  
  )
)
set MYTEMPVAR=
if not defined PACKAGE_VERSION goto abort

:: fail if release package already exists
set PACKAGE_RELEASEFILE=sid_release_%PACKAGE_VERSION:~0,-2%.zip
if not EXIST %PACKAGE_RELEASEFILE% goto continue01
echo %PACKAGE_RELEASEFILE% already exists
goto abort

:continue01
echo remove staging directories...
rmdir release_staging /S /Q  > makerelease.log 2>&1

echo creating staging directories...
mkdir release_staging  >> makerelease.log 2>&1
mkdir release_staging\styles  >> makerelease.log 2>&1
mkdir release_staging\scripts  >> makerelease.log 2>&1

echo copying files to staging...
xcopy popup.html release_staging  >> makerelease.log 2>&1
xcopy manifest.json release_staging  >> makerelease.log 2>&1
xcopy LICENSE release_staging  >> makerelease.log 2>&1
xcopy *.png release_staging  >> makerelease.log 2>&1
xcopy styles\*.* release_staging\styles  >> makerelease.log 2>&1
xcopy scripts\*.* release_staging\scripts  >> makerelease.log 2>&1

echo creating ZIP for release...
cd release_staging  >> makerelease.log 2>&1
"C:\Program Files\7-zip\7z.exe" a -r ..\%PACKAGE_RELEASEFILE% *  >> ../makerelease.log 2>&1
cd ..  >> ../makerelease.log 2>&1


echo.
echo release package for Student infoDeck is complete
echo release file name: %PACKAGE_RELEASEFILE%
echo.
pause
goto the_end

:abort
echo.
echo *** release package build aborted ***
echo.
pause
goto the_end

:the_end
set PACKAGE_VERSION=
set PACKAGE_RELEASEFILE=
exit /B
