VERSION := $(shell grep '<em:version>' install.rdf | sed 's/^.*>\(.*\)<.*$$/\1/')

all: identfavicon-$(VERSION)-fx.xpi

chrome/identfavicon.jar: content/* locale/*/* skin/*
	-$(RM) $@
	zip $@ $^

identfavicon-$(VERSION)-fx.xpi: chrome/identfavicon.jar defaults/*/* install.rdf chrome/chrome.manifest
	-$(RM) $@
	zip $@ chrome/identfavicon.jar defaults/*/* install.rdf -j chrome/chrome.manifest

.PHONY: all
