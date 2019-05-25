:: create release package for Student infoDeck Chrome extension
@echo *******************************************************
@echo * building release package for Student infoDeck
@echo *******************************************************

@echo.
@set SIDVERSION=
@set SIDRELEASEFILE=

:: get version string for package
@set /p SIDVERSION="Enter version for the release (n.nn.nn): "
@if not defined SIDVERSION goto abort

:: fail if release package already exists
@set SIDRELEASEFILE=sid_release_%SIDVERSION%.zip
@if not EXIST %SIDRELEASEFILE% goto continue01
@echo %SIDRELEASEFILE% already exists
@goto abort

:continue01
@echo remove staging directories...
@rmdir release_staging /S /Q  > makerelease.log 2>&1

@echo creating staging directories...
@mkdir release_staging  >> makerelease.log 2>&1
@mkdir release_staging\styles  >> makerelease.log 2>&1
@mkdir release_staging\scripts  >> makerelease.log 2>&1

@echo copying files to staging...
@xcopy popup.html release_staging  >> makerelease.log 2>&1
@xcopy manifest.json release_staging  >> makerelease.log 2>&1
@xcopy LICENSE release_staging  >> makerelease.log 2>&1
@xcopy *.png release_staging  >> makerelease.log 2>&1
@xcopy styles\*.* release_staging\styles  >> makerelease.log 2>&1
@xcopy scripts\*.* release_staging\scripts  >> makerelease.log 2>&1

@echo creating ZIP for release...
@cd release_staging  >> makerelease.log 2>&1
@"C:\Program Files\7-zip\7z.exe" a -r ..\%SIDRELEASEFILE% *  >> ../makerelease.log 2>&1
@cd ..  >> ../makerelease.log 2>&1


@echo.
@echo release package for Student infoDeck is complete
@echo release file name: %SIDRELEASEFILE%
@echo.
@pause
@goto the_end

:abort
@echo.
@echo *** release package build aborted ***
@echo.
@pause
@goto the_end

:the_end
@set SIDVERSION=
@set SIDRELEASEFILE=
@exit /B

