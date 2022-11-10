class DependantCheckBoxes {

	constructor() {
		this.dependants = [];
	}

	add(cb) {
		this.dependants[this.dependants.length] = cb;
		cb.setDependancy(this);
	}

	get(i) {
		if (i<this.dependants.length) return this.dependants[i];
	}

	getChecked() {
		for (var i=0; i<this.dependants.length; i++) {
			if (this.dependants[i].isChecked) return this.dependants[i];
		}
	}

	enforceDependancy(justChecked) {
		for (var i=0; i<this.dependants.length; i++) {
			if (this.dependants[i]!=justChecked
				&&this.dependants[i].isChecked) {
				this.dependants[i].toggleCheckBox(true);
			}
		}
	}
}