all: chrome/identfavicon.jar

chrome/identfavicon.jar: content/* locale/*/* skin/* defaults/*/*
	-$(RM) $@
	zip $@ $^

.PHONY: all
