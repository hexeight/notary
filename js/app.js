function RegisterHash (hash, cb) {
    var registry = NotaryFactory.deployed();
    registry.Notarize(hash, { from: web3.eth.defaultAccount }, function (e, c) {
        cb(e, c);
    });
}

function VerifyHashOwner (hash, cb) {
    var registry = NotaryFactory.deployed();
    registry.VerifyAuthor.call(hash, { from: web3.eth.defaultAccount }, function (e, c) {
        cb(e, c);
    });
}

function VerifyTime (hash, cb) {
    var registry = NotaryFactory.deployed();
    registry.VerifyTime.call(hash, { from: web3.eth.defaultAccount }, function (e, c) {
        cb(e, c);
    });
}

var progress = document.querySelector('.percent');
function errorHandler(evt) {
    switch(evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
        case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
        case evt.target.error.ABORT_ERR:
        break; // noop
        default:
        alert('An error occurred reading this file.');
    };
}

function updateProgress(evt) {
// evt is an ProgressEvent.
    if (evt.lengthComputable) {
        var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
        // Increase the progress bar length.
        if (percentLoaded < 100) {
        progress.style.width = percentLoaded + '%';
        progress.textContent = percentLoaded + '%';
        }
    }
}

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    if (files.length <= 0)
        return;
    
    var f = files[0];
    /*output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                  f.size, ' bytes, last modified: ',
                  f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                  '</li>');*/
    var reader = new FileReader();
    reader.onload = function (e) {
        //console.log(sha256(e.target.result));
        app.file(e.target.result);
        app.verifyNotary();
    };
    reader.onerror = errorHandler;
    reader.onprogress = updateProgress;
    reader.onabort = function(e) {
        alert('File read cancelled');
    };
    reader.onloadstart = function(e) {
        //document.getElementById('progress_bar').className = 'loading';
    };
    reader.readAsBinaryString(f.slice(0, f.size - 1));
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  // Setup the dnd listeners.
  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileSelect, false);

var app;
function initApp () {
    var ViewModel = function () {
        var self = this;

        self.contractAddress = ko.observable();
        self.file = ko.observable();
        self.status = ko.observable(null);
        self.fileHash = ko.computed(function () {
            self.status(null);
            if (self.file() != null) {
                return sha256(self.file());
            }
            else {
                return null;
            }
        }, self);

        self.notarize = function () {
            RegisterHash(self.fileHash(), function (e, c) {
                if (!e) {

                }
            });
        }

        self.owner = ko.observable();
        self.time = ko.observable();
        self.verifyNotary = function () {
            self.status("validating");
            VerifyHashOwner(self.fileHash(), function (e, c) {
                if (!e) {
                    if (parseInt(c) <= 0) {
                        self.status("notfound");
                        return;
                    } else {
                        self.owner(c);
                        VerifyTime(self.fileHash(), function (e, time) {
                            self.time(new Date(time * 1000));
                            self.status("found");
                        });
                    }
                }
                self.status("error");
            })
        }
    }

    pager.Href.hash = '#!/';
    app = new ViewModel();
    pager.extendWithPage(app);
    ko.applyBindings(app);
    pager.start();
}

window.addEventListener('web3-loaded', initApp);